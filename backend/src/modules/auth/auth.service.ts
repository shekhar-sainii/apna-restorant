import crypto from "crypto";
import { OAuth2Client } from "google-auth-library";
import authRepository from "./auth.repository";
import User from "../../models/User.model";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "../../utils/generateToken";
import ApiError from "../../utils/ApiError";
import { IUserDocument } from "../../models/User.model";
import { IUser } from "../../shared/types/user.types";

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

interface AuthResult {
  user: Omit<IUser, "createdAt" | "updatedAt"> & { _id: string };
  accessToken: string;
  refreshToken: string;
}

interface RefreshResult {
  accessToken: string;
  refreshToken: string;
}

class AuthService {
  async register({ name, email, phone, password }: Partial<IUserDocument>): Promise<AuthResult> {
    if (!name || !email || !phone || !password) {
      throw ApiError.badRequest("Missing registration fields");
    }

    const emailExists = await authRepository.findByEmail(email);
    if (emailExists) throw ApiError.conflict("Email already registered");

    const phoneExists = await authRepository.findByPhone(phone);
    if (phoneExists) throw ApiError.conflict("Phone already registered");

    const user = await authRepository.create({ name, email, phone, password });

    const accessToken = generateAccessToken(user._id.toString(), user.role);
    const refreshToken = generateRefreshToken(user._id.toString());
    await authRepository.saveRefreshToken(user._id.toString(), refreshToken);

    return { user: user.toSafeObject(), accessToken, refreshToken };
  }

  async login({ email, password }: Partial<IUserDocument>): Promise<AuthResult> {
    if (!email || !password) {
      throw ApiError.badRequest("Email and password are required");
    }

    const user = await authRepository.findByEmail(email);
    if (!user) throw ApiError.unauthorized("Invalid credentials");

    if (!user.isActive) throw ApiError.unauthorized("Account is deactivated");

    const isValid = await user.comparePassword(password);
    if (!isValid) throw ApiError.unauthorized("Invalid credentials");

    const accessToken = generateAccessToken(user._id.toString(), user.role);
    const refreshToken = generateRefreshToken(user._id.toString());
    await authRepository.saveRefreshToken(user._id.toString(), refreshToken);

    return { user: user.toSafeObject(), accessToken, refreshToken };
  }

  async googleLogin(idToken: string): Promise<AuthResult> {
    if (!idToken) {
      throw ApiError.badRequest("Google ID Token is required");
    }

    let payload: any;
    try {
      const ticket = await googleClient.verifyIdToken({
        idToken,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      payload = ticket.getPayload();
    } catch (err: any) {
      throw ApiError.badRequest(`Google token verification failed: ${err.message}`);
    }

    if (!payload || !payload.email) {
      throw ApiError.badRequest("Invalid payload received from Google");
    }

    const { email, name, picture } = payload;
    let user = await authRepository.findByEmail(email);

    let isNewUser = false;
    if (!user) {
      const randomPassword = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      user = await authRepository.create({
        name: name || "Google User",
        email,
        phone: `G-${Math.floor(1000000000 + Math.random() * 9000000000)}`,
        password: randomPassword,
        profileImage: picture || null,
      });
      isNewUser = true;
    }

    if (!user.isActive) {
      throw ApiError.unauthorized("Account is deactivated");
    }

    const accessToken = generateAccessToken(user._id.toString(), user.role);
    const refreshToken = generateRefreshToken(user._id.toString());
    await authRepository.saveRefreshToken(user._id.toString(), refreshToken);

    const safeUser = user.toSafeObject();
    if (isNewUser) {
      (safeUser as any).isNewUser = true;
    }

    return { user: safeUser, accessToken, refreshToken };
  }

  async forgotPassword(email: string): Promise<string> {
    const user = await authRepository.findByEmail(email);
    if (!user) {
      throw ApiError.notFound("User with this email does not exist");
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex");

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 mins
    await user.save();

    return resetToken;
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: new Date() },
    });

    if (!user) {
      throw ApiError.badRequest("Password reset token is invalid or has expired");
    }

    user.password = newPassword;
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();
  }

  async refresh(refreshToken: string | undefined): Promise<RefreshResult> {
    if (!refreshToken) throw ApiError.unauthorized("No refresh token");

    let decoded: { userId: string };
    try {
      decoded = verifyRefreshToken(refreshToken);
    } catch {
      throw ApiError.unauthorized("Invalid refresh token");
    }

    const user = await authRepository.findByRefreshToken(decoded.userId, refreshToken);
    if (!user) throw ApiError.unauthorized("Refresh token not found or expired");

    const newAccessToken = generateAccessToken(user._id.toString(), user.role);
    const newRefreshToken = generateRefreshToken(user._id.toString());
    await authRepository.saveRefreshToken(user._id.toString(), newRefreshToken);

    return { accessToken: newAccessToken, refreshToken: newRefreshToken };
  }

  async logout(userId: string): Promise<void> {
    await authRepository.clearRefreshToken(userId);
  }
}

export default new AuthService();
