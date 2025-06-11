import { UserJWTPayload } from "../auth";
import { Language } from "../language";

export {};

declare global {
  namespace Express {
    interface Request {
      currentUser?: UserJWTPayload;
      lang: Language;
    }
  }
}
