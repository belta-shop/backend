import { Request, Response } from "express";
import User from "../models/user.model";
import { StatusCodes } from "http-status-codes";
import { MongooseError } from "mongoose";
import ErrorAPI from "../errors/error-api";
import { comparePassowrd, genOTP, hashPaswword } from "../utils/bcrypt";
import { signToken, verifyUserToken } from "../utils/jwt";
import OTP from "../models/otp.model";
import { allOtpPurposes, OTPPurpose } from "../types/otp";
import BadRequest from "../errors/bad-request";
import { sendOtp } from "../utils/otp";
import { sendOTPMail } from "../utils/email";
import Unauthorized from "../errors/unauthorized";
import CustomError from "../errors/custom-error";

export const register = async (req: Request, res: Response) => {
  try {
    // Create User
    const hashed = hashPaswword(req.body.password);
    await User.create({
      ...req.body,
      password: hashed,
    });

    // Create OTP
    const otpValue = genOTP();
    await OTP.create({
      email: req.body.email,
      value: otpValue,
      purpose: OTPPurpose.Register,
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });

    // Send OTP
    sendOTPMail({
      receiver: req.body.email,
      otp: otpValue,
      name: req.body.fullName,
      lang: req.headers["accept-language"],
      purpose: OTPPurpose.Register,
    });

    res
      .json({
        success: true,
      })
      .status(StatusCodes.CREATED);
  } catch (error) {
    if (
      error instanceof MongooseError &&
      error.message === "duplicate_email_error"
    ) {
      throw new ErrorAPI(error.message, StatusCodes.CONFLICT);
    } else throw Error;
  }
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
      const { _id: id, fullName, email, confirmed, role } = user;

      const accessToken = signToken(
        { sub: id, email, role },
        {
          expiresIn: "15m",
        }
      );
      const refreshToken = signToken(
        { sub: id, email, role },
        {
          expiresIn: "1w",
        }
      );

      const body = {
        id,
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
  const { sub, email, role, user } = await verifyUserToken(req.body.token);

  const accessToken = signToken(
    { sub, email, role },
    {
      expiresIn: "15m",
    }
  );
  const refreshToken = signToken(
    { sub, email, role },
    {
      expiresIn: "1w",
    }
  );

  const { _id: id, fullName, confirmed } = user;

  const body = {
    id,
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

export const verifyOTP = async (
  req: Request<{}, {}, { otp: string; purpose: OTPPurpose }>,
  res: Response
) => {
  if (!req.currentUser) throw new Unauthorized();
  const { sub, email, role } = req.currentUser;
  const { otp, purpose } = req.body;

  if (!email || !otp || !purpose)
    throw new BadRequest("email, otp and purpose are required");

  if (!allOtpPurposes.includes(purpose as any))
    throw new BadRequest(
      `pupose should be one of [ ${allOtpPurposes.join(", ")} ]`
    );

  const otpDoc = await OTP.findOne({ email });
  if (
    !otpDoc ||
    otp !== otpDoc.value ||
    req.ip !== otpDoc.ipAddress ||
    req.headers["user-agent"] !== otpDoc.userAgent ||
    purpose !== otpDoc.purpose
  )
    throw new ErrorAPI("invalid_otp", StatusCodes.UNAUTHORIZED);

  await OTP.deleteOne({ email });

  if (purpose === OTPPurpose.Register) {
    await User.updateOne({ email }, { confirmed: true });
  } else if (purpose === OTPPurpose.ResetPassword) {
    const resetPasswordToken = signToken(
      { sub, email, role, purpose },
      {
        expiresIn: "15m",
      }
    );
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

  const { email, purpose } = req.currentUser;

  const { password } = req.body;

  if (!password) throw new BadRequest("password is required");

  if (purpose !== OTPPurpose.ResetPassword)
    throw new CustomError("invalid token", StatusCodes.FORBIDDEN);

  const user = await User.findOne({ email });
  if (!user) throw new CustomError("invalid token", StatusCodes.FORBIDDEN);

  if (comparePassowrd(password, user.password))
    throw new ErrorAPI("same_password", StatusCodes.CONFLICT);

  const hashed = hashPaswword(req.body.password);
  await User.updateOne({ email }, { password: hashed });

  res.status(StatusCodes.OK).json({
    success: true,
  });
};
