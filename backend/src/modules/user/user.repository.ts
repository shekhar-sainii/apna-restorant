import User, { IUserDocument } from "../../models/User.model";
import Address, { IAddress } from "../../models/Address.model";

class UserRepository {
  async findById(id: string): Promise<IUserDocument | null> {
    return User.findById(id);
  }

  async updateProfile(id: string, data: Partial<IUserDocument>): Promise<IUserDocument | null> {
    return User.findByIdAndUpdate(id, data, { new: true });
  }

  async findAllUsers(): Promise<IUserDocument[]> {
    return User.find().sort({ createdAt: -1 });
  }

  async findAddressesByUser(userId: string): Promise<IAddress[]> {
    return Address.find({ user: userId as any }).sort({ isDefault: -1, createdAt: -1 });
  }

  async createAddress(userId: string, data: Partial<IAddress>): Promise<IAddress> {
    return Address.create({ ...data, user: userId as any });
  }

  async findAddressById(id: string, userId: string): Promise<IAddress | null> {
    return Address.findOne({ _id: id, user: userId as any });
  }

  async updateAddress(id: string, userId: string, data: Partial<IAddress>): Promise<IAddress | null> {
    return Address.findOneAndUpdate({ _id: id, user: userId as any }, data, { new: true });
  }

  async deleteAddress(id: string, userId: string): Promise<IAddress | null> {
    return Address.findOneAndDelete({ _id: id, user: userId as any });
  }

  async clearOtherDefaults(userId: string, excludeAddressId: string): Promise<void> {
    await Address.updateMany(
      { user: userId as any, _id: { $ne: excludeAddressId } },
      { isDefault: false }
    );
  }
}

export default new UserRepository();
