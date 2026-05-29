import { Role } from "../constants/roles";

export interface IUser {
  _id: string;
  name: string;
  email: string;
  phone: string;
  role: Role;
  isActive: boolean;
  profileImage?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface IAuthUser {
  id: string;
  name: string;
  email: string;
  role: Role;
}
