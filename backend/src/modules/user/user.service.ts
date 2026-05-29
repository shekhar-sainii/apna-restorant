import userRepository from "./user.repository";
import ApiError from "../../utils/ApiError";
import { ROLES } from "../../shared/constants/roles";

class UserService {
  async getProfile(userId: string) {
    const user = await userRepository.findById(userId);
    if (!user) throw ApiError.notFound("User not found");
    return user.toSafeObject();
  }

  async updateProfile(userId: string, data: any) {
    const allowedUpdates = ["name", "phone", "profileImage"];
    const updates: any = {};
    for (const key of allowedUpdates) {
      if (data[key] !== undefined) updates[key] = data[key];
    }

    const user = await userRepository.updateProfile(userId, updates);
    if (!user) throw ApiError.notFound("User not found");
    return user.toSafeObject();
  }

  async getAddresses(userId: string) {
    return userRepository.findAddressesByUser(userId);
  }

  async addAddress(userId: string, data: any) {
    const addresses = await userRepository.findAddressesByUser(userId);
    
    if (addresses.length === 0) {
      data.isDefault = true;
    }

    const address = await userRepository.createAddress(userId, data);

    if (address.isDefault) {
      await userRepository.clearOtherDefaults(userId, address._id.toString());
    }

    return address;
  }

  async updateAddress(userId: string, addressId: string, data: any) {
    const address = await userRepository.updateAddress(addressId, userId, data);
    if (!address) throw ApiError.notFound("Address not found");

    if (address.isDefault) {
      await userRepository.clearOtherDefaults(userId, address._id.toString());
    }

    return address;
  }

  async deleteAddress(userId: string, addressId: string) {
    const address = await userRepository.deleteAddress(addressId, userId);
    if (!address) throw ApiError.notFound("Address not found");

    if (address.isDefault) {
      const remaining = await userRepository.findAddressesByUser(userId);
      if (remaining.length > 0) {
        await userRepository.updateAddress(remaining[0]._id.toString(), userId, { isDefault: true });
      }
    }

    return address;
  }

  async getAllUsers() {
    const users = await userRepository.findAllUsers();
    return users.map(u => u.toSafeObject());
  }

  async updateUserStatus(userId: string, isActive?: boolean) {
    const existing = await userRepository.findById(userId);
    if (!existing) throw ApiError.notFound("User not found");
    const nextActive = isActive !== undefined ? isActive : !existing.isActive;
    const user = await userRepository.updateProfile(userId, { isActive: nextActive });
    if (!user) throw ApiError.notFound("User not found");
    return user.toSafeObject();
  }

  async updateUserRole(userId: string, role: string, adminId: string) {
    const validRoles = Object.values(ROLES);
    if (!validRoles.includes(role as (typeof validRoles)[number])) {
      throw ApiError.badRequest("Invalid role. Use admin, staff, or user");
    }

    if (userId === adminId && role !== ROLES.ADMIN) {
      throw ApiError.badRequest("You cannot remove your own admin role");
    }

    const user = await userRepository.updateProfile(userId, { role: role as any });
    if (!user) throw ApiError.notFound("User not found");
    return user.toSafeObject();
  }
}

export default new UserService();
