import { model, Schema } from "mongoose";
import { emailRegex } from "../config/regex";
import { OTPPurpose } from "../types/otp";
import { OTP_EXPIRE_TIME } from "../config/global";

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
    enum: {
      values: [OTPPurpose.EmailConfirmation, OTPPurpose.ResetPassword],
      message: "Invalid purpose",
    },
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
