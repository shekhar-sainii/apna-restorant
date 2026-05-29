import User, { IUserDocument } from "../../models/User.model";
import { hashToken } from "../../utils/generateToken";

class AuthRepository {
  async findByEmail(email: string): Promise<IUserDocument | null> {
    return User.findOne({ email: email.toLowerCase() });
  }

  async findByPhone(phone: string): Promise<IUserDocument | null> {
    return User.findOne({ phone });
  }

  async create(userData: Partial<IUserDocument>): Promise<IUserDocument> {
    return User.create(userData);
  }

  async findById(id: string): Promise<IUserDocument | null> {
    return User.findById(id).select("-password");
  }

  async saveRefreshToken(userId: string, refreshToken: string): Promise<IUserDocument | null> {
    const hashed = hashToken(refreshToken);
    return User.findByIdAndUpdate(userId, { refreshToken: hashed }, { new: true });
  }

  async clearRefreshToken(userId: string): Promise<IUserDocument | null> {
    return User.findByIdAndUpdate(userId, { refreshToken: null }, { new: true });
  }

  async findByRefreshToken(userId: string, refreshToken: string): Promise<IUserDocument | null> {
    const hashed = hashToken(refreshToken);
    return User.findOne({ _id: userId, refreshToken: hashed });
  }
}

export default new AuthRepository();
