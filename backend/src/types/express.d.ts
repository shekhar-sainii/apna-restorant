import { IUser } from "../shared/types/user.types";

declare global {
  namespace Express {
    interface Request {
      user?: IUser;
      guestSessionId?: string;
    }
  }
}
export {};
