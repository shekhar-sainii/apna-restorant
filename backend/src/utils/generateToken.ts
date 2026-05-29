import jwt from "jsonwebtoken";
import crypto from "crypto";

export const generateAccessToken = (userId: string, role: string): string => {
  const secret = process.env.JWT_ACCESS_SECRET;
  if (!secret) throw new Error("JWT_ACCESS_SECRET is not configured");
  return jwt.sign(
    { userId, role },
    secret,
    { expiresIn: "15m" }
  );
};

export const generateRefreshToken = (userId: string): string => {
  const secret = process.env.JWT_REFRESH_SECRET;
  if (!secret) throw new Error("JWT_REFRESH_SECRET is not configured");
  return jwt.sign(
    { userId },
    secret,
    { expiresIn: "7d" }
  );
};

export const hashToken = (token: string): string => {
  return crypto.createHash("sha256").update(token).digest("hex");
};

export const verifyRefreshToken = (token: string): any => {
  const secret = process.env.JWT_REFRESH_SECRET;
  if (!secret) throw new Error("JWT_REFRESH_SECRET is not configured");
  return jwt.verify(token, secret);
};
