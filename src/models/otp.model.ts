import { model, Schema } from "mongoose";
import { emailRegex } from "../config/regex";
import { OTP_EXPIRE_TIME, OTPPurpose } from "../types/otp";

const OtpSchema = new Schema({
  email: {
    type: String,
    required: [true, "Email is required"],
    match: [emailRegex, "Please enter a valid email"],
    index: { unique: [true, "duplicate_email_error"] },
  },
  value: {
    type: String,
    required: [true, "OTP is requried"],
  },
  purpose: {
    type: String,
    enum: [OTPPurpose.EmailConfirmation, OTPPurpose.ResetPassword],
  },
  userAgent: String,
  ipAddress: String,
  expireAt: {
    type: Date,
    default: () => new Date(Date.now() + OTP_EXPIRE_TIME),
    expires: 10,
  },
});

const OTP = model("OTP", OtpSchema);

export default OTP;
