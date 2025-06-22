import { Request, Response } from "express";
import User from "../models/user.model";
import { StatusCodes } from "http-status-codes";
import ErrorAPI from "../errors/error-api";
import { comparePassowrd, genOTP, hashPaswword } from "../utils/bcrypt";
import {
  signAccessToken,
  signPurposeToken,
  signRefreshToken,
  verifyUserToken,
} from "../utils/jwt";
import OTP from "../models/otp.model";
import { OTPPurpose } from "../types/otp";
import BadRequest from "../errors/bad-request";
import { sendOtp } from "../utils/otp";
import { sendOTPMail } from "../utils/email";
import Unauthorized from "../errors/unauthorized";
import Token from "../models/token.model";
import CustomError from "../errors/custom-error";

export const register = async (req: Request, res: Response) => {
  // Create User

  if (req.body.role === "admin")
    throw new CustomError("admin is not supported", StatusCodes.BAD_REQUEST);

  const hashed = hashPaswword(req.body.password);
  await User.create({
    ...req.body,
    password: hashed,
  });

  res
    .json({
      success: true,
    })
    .status(StatusCodes.CREATED);
};

export const login = async (
  req: Request<{}, {}, { email?: string; password?: string }>,
  res: Response
) => {
  const { email, password } = req.body || {};
  if (!email || !password)
    throw new ErrorAPI("Invalid credentials", StatusCodes.BAD_REQUEST);

  const user = await User.findOne({ email });

  if (!user) {
    throw new ErrorAPI("invalid_email_or_password", StatusCodes.UNAUTHORIZED);
  } else {
    if (!comparePassowrd(password, user.password)) {
      throw new ErrorAPI("invalid_email_or_password", StatusCodes.UNAUTHORIZED);
    } else {
      const { _id, fullName, email, confirmed, role } = user;

      const accessToken = signAccessToken({ id: _id.toString(), email, role });
      const refreshToken = await signRefreshToken({
        id: _id.toString(),
        email,
        role,
      });

      if (!confirmed) {
        // Create OTP
        const otpValue = genOTP();
        await OTP.create({
          email: req.body.email,
          value: otpValue,
          purpose: OTPPurpose.EmailConfirmation,
          ipAddress: req.ip,
          userAgent: req.headers["user-agent"],
        });

        // Send OTP
        sendOTPMail({
          receiver: email,
          otp: otpValue,
          name: fullName,
          lang: req.headers["accept-language"],
          purpose: OTPPurpose.EmailConfirmation,
        });
      }

      const body = {
        _id,
        fullName,
        email,
        confirmed,
        role,
        accessToken,
        accessTokenExpireDate: new Date(Date.now() + 15 * 60 * 1000),
        refreshToken,
        refreshTokenExpireDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      };

      res.status(StatusCodes.OK).json(body);
    }
  }
};

export const refreshAccessToken = async (
  req: Request<{}, {}, { token: string }>,
  res: Response
) => {
  const { sub, tokenId, email, role, user } = await verifyUserToken(
    req.body.token
  );

  if (!tokenId) throw new Unauthorized();

  await Token.deleteOne({ uuid: tokenId });

  const accessToken = signAccessToken({ id: sub, email, role });
  const refreshToken = await signRefreshToken({ id: sub, email, role });

  const { _id, fullName, confirmed } = user;

  const body = {
    _id,
    fullName,
    email,
    confirmed,
    role,
    accessToken,
    accessTokenExpireDate: new Date(Date.now() + 15 * 60 * 1000),
    refreshToken,
    refreshTokenExpireDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  };

  res.status(StatusCodes.CREATED).json(body);
};

export const resendOTP = async (
  req: Request<{}, {}, { purpose: OTPPurpose }>,
  res: Response
) => {
  if (!req.currentUser) throw new Unauthorized();
  const { email } = req.currentUser;
  const { purpose } = req.body;

  await sendOtp({
    email,
    purpose,
    ip: req.ip,
    userAgent: req.headers["user-agent"],
    lang: req.headers["accept-language"],
  });

  res.status(StatusCodes.OK).json({
    success: true,
  });
};

export const sendGuestOtp = async (
  req: Request<{}, {}, { purpose: OTPPurpose; email: string }>,
  res: Response
) => {
  const { purpose, email } = req.body;

  await sendOtp({
    email,
    purpose,
    ip: req.ip,
    userAgent: req.headers["user-agent"],
    lang: req.headers["accept-language"],
  });

  res.status(StatusCodes.OK).json({
    success: true,
  });
};

export const verifyOTP = async (
  req: Request<{}, {}, { otp: string; purpose: OTPPurpose }>,
  res: Response
) => {
  if (!req.currentUser) throw new Unauthorized();
  const { sub, email, role } = req.currentUser;
  const { otp, purpose } = req.body;

  if (!email || !otp || !purpose)
    throw new BadRequest("email, otp and purpose are required");

  // default otp: that will be used for testing
  if (otp !== "1111") {
    const otpDoc = await OTP.findOne({ email });
    if (
      !otpDoc ||
      otp !== otpDoc.value ||
      req.ip !== otpDoc.ipAddress ||
      req.headers["user-agent"] !== otpDoc.userAgent ||
      purpose !== otpDoc.purpose
    )
      throw new ErrorAPI("invalid_otp", StatusCodes.UNAUTHORIZED);
  }

  await OTP.deleteOne({ email });

  if (purpose === OTPPurpose.EmailConfirmation) {
    await User.updateOne({ email }, { confirmed: true });
  } else if (purpose === OTPPurpose.ResetPassword) {
    const resetPasswordToken = await signPurposeToken({
      id: sub,
      email,
      role,
      purpose: OTPPurpose.ResetPassword,
    });

    res.status(StatusCodes.OK).json({
      success: true,
      resetPasswordToken,
    });
  }
  res.status(StatusCodes.OK).json({
    success: true,
  });
};

export const verifyGuestOtp = async (
  req: Request<{}, {}, { otp: string; purpose: OTPPurpose; email: string }>,
  res: Response
) => {
  const { otp, email, purpose } = req.body;
  const user = await User.findOne({ email });
  if (!user) throw new Unauthorized();
  const { _id, role } = user;
  const sub = _id.toString();

  if (!email || !otp || !purpose)
    throw new BadRequest("email, otp and purpose are required");

  // default otp: that will be used for testing
  if (otp !== "1111") {
    const otpDoc = await OTP.findOne({ email });
    if (
      !otpDoc ||
      otp !== otpDoc.value ||
      req.ip !== otpDoc.ipAddress ||
      req.headers["user-agent"] !== otpDoc.userAgent ||
      purpose !== otpDoc.purpose
    )
      throw new ErrorAPI("invalid_otp", StatusCodes.UNAUTHORIZED);
  }

  await OTP.deleteOne({ email });

  if (purpose === OTPPurpose.EmailConfirmation) {
    await User.updateOne({ email }, { confirmed: true });
  } else if (purpose === OTPPurpose.ResetPassword) {
    const resetPasswordToken = await signPurposeToken({
      id: sub,
      email,
      role,
      purpose: OTPPurpose.ResetPassword,
    });

    res.status(StatusCodes.OK).json({
      success: true,
      resetPasswordToken,
    });
  }
  res.status(StatusCodes.OK).json({
    success: true,
  });
};

export const resetPassword = async (req: Request, res: Response) => {
  if (!req.currentUser) throw new Unauthorized();

  const { email, purpose, tokenId } = req.currentUser;

  const { password } = req.body;

  if (!password) throw new BadRequest("password is required");

  if (purpose !== OTPPurpose.ResetPassword) throw new Unauthorized();

  const user = await User.findOne({ email });
  if (!user) throw new Unauthorized();

  if (comparePassowrd(password, user.password))
    throw new ErrorAPI("same_password", StatusCodes.CONFLICT);

  const hashed = hashPaswword(req.body.password);
  await User.updateOne({ email }, { password: hashed });

  await Token.deleteOne({ uuid: tokenId });

  res.status(StatusCodes.OK).json({
    success: true,
  });
};
