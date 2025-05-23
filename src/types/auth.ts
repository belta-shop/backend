import { OTPPurpose } from "./otp";

export type UserJWTPayload = Record<"sub" | "email" | "role", string> & {
  purpose?: null | OTPPurpose;
};
