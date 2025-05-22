export const enum OTPPurpose {
  Register = "register",
  ResetPassword = "reset_password",
}
export const allOtpPurposes: OTPPurpose[] = [
  OTPPurpose.Register,
  OTPPurpose.ResetPassword,
];

export const OTP_EXPIRE_TIME = 10 * 60 * 1000;
