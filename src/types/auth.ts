import { OTPPurpose } from "./otp";

export type UserJWTPayload = Record<"sub" | "role" | "provider", string> & {
  purpose?: null | OTPPurpose;
  tokenId?: string;
} & ({ email: string } | { providerId: string });

export type GitHubProfile = {
  providerId: string;
  fullName: string;
  provider: "github";
  role: "client";
  confirmed: boolean;
};
