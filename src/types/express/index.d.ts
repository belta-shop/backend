import { UserJWTPayload } from "../auth";

export {};

declare global {
  namespace Express {
    interface Request {
      currentUser?: UserJWTPayload;
    }
  }
}
