import { StatusCodes } from "http-status-codes";
import BadRequest from "../errors/bad-request";
import ErrorAPI from "../errors/error-api";
import User from "../models/user.model";
import { allOtpPurposes, OTPPurpose } from "../types/otp";
import { genOTP } from "./bcrypt";
import OTP from "../models/otp.model";
import { sendOTPMail } from "./email";
import { OTP_EXPIRE_TIME } from "../config/global";

export async function sendOtp({
  email,
  purpose,
  ip,
  userAgent,
  lang,
}: Record<
  "email" | "purpose" | "lang" | "ip" | "userAgent",
  string | undefined
>) {
  if (!email || !purpose)
    throw new BadRequest("email and purpose are required");

  if (!allOtpPurposes.includes(purpose as any))
    throw new BadRequest(
      `pupose should be one of [ ${allOtpPurposes.join(", ")} ]`
    );

  const user = await User.findOne({ email });
  if (!user) throw new ErrorAPI("no_user_with_email", StatusCodes.NOT_FOUND);

  if (purpose === OTPPurpose.EmailConfirmation && user.confirmed)
    throw new ErrorAPI("email_already_confirmed", StatusCodes.CONFLICT);

  // Create OTP
  const otpValue = genOTP();
  await OTP.updateOne(
    { email },
    {
      $set: {
        value: otpValue,
        purpose: purpose,
        ipAddress: ip,
        userAgent: userAgent,
        expireAt: new Date(Date.now() + OTP_EXPIRE_TIME),
      },
    },
    { upsert: true }
  );

  // Send OTP
  sendOTPMail({
    receiver: email,
    otp: otpValue,
    name: user.fullName,
    lang: lang,
    purpose: purpose as OTPPurpose,
  });
}
