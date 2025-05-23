import nodemailer, { SendMailOptions } from "nodemailer";
import ErrorAPI from "../errors/error-api";
import { StatusCodes } from "http-status-codes";
import { OTPPurpose } from "../types/otp";
import { t } from "./translate";

const { NODEMAILER_USER, NODEMAILER_PASS, NODEMAILER_SENDER_EMAIL } =
  process.env;

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: NODEMAILER_USER,
    pass: NODEMAILER_PASS,
  },
});

export function sendMail(options: Omit<SendMailOptions, "from">) {
  transporter.sendMail(
    { from: NODEMAILER_SENDER_EMAIL, ...options },
    function (error, info) {
      if (error) {
        throw new ErrorAPI(error.message, StatusCodes.BAD_GATEWAY);
      } else {
        console.log("Email sent: " + info.response);
      }
    }
  );
}

export function sendOTPMail({
  receiver,
  otp,
  name,
  lang,
  purpose,
}: {
  receiver: string;
  otp: string;
  name: string;
  lang: string | undefined;
  purpose: OTPPurpose;
}) {
  sendMail({
    to: receiver,
    subject: t(`Email.OTP.${purpose}_subject`, lang),
    html: t(`Email.OTP.${purpose}_body`, lang, { name, otp }),
  });
}
