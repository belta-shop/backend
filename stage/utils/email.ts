import nodemailer, { SendMailOptions } from "nodemailer";
import ErrorAPI from "../errors/error-api";
import { StatusCodes } from "http-status-codes";
import { DEFAULT_LANGUAGE } from "../config/global";

const { NODEMAILER_USER, NODEMAILER_PASS, NODEMAILER_SENDER_EMAIL } =
  process.env;

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: NODEMAILER_USER,
    pass: NODEMAILER_PASS,
  },
});

export async function sendMail(options: Omit<SendMailOptions, "from">) {
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

export async function sendOTP(
  receiver: string,
  otp: string,
  locale = DEFAULT_LANGUAGE
) {
  await sendMail({
    to: receiver,
    subject: "otp",
  });
}
