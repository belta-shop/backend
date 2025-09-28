import { OTPPurpose } from "./otp";

export type UserJWTPayload = Record<"sub" | "role" | "provider", string> & {
  purpose?: null | OTPPurpose;
  tokenId?: string;
} & ({ email: string } | { providerId: string });
