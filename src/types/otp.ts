export const enum OTPPurpose {
  EmailConfirmation = "email_confirmation",
  ResetPassword = "reset_password",
}
export const allOtpPurposes: OTPPurpose[] = [
  OTPPurpose.EmailConfirmation,
  OTPPurpose.ResetPassword,
];
