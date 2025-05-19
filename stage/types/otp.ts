export const enum OTPPurpose {
  Register = "register",
}
export const allOtpPurposes: OTPPurpose[] = [OTPPurpose.Register];

export const OTP_EXPIRE_TIME = 10 * 60 * 1000;
