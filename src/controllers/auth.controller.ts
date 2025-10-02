import { Request, Response } from "express";
import User from "../models/auth/user.model";
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
import UserEmail from "../models/auth/user-email.model";
import { GitHubProfile } from "../types/auth";
import UserProvider from "../models/auth/user-provider.model";

export const register = async (req: Request, res: Response) => {
  // Create User
  if (!req.body.password) throw new BadRequest("password is required");

  if (req.body.role === "admin")
    throw new CustomError("admin is not supported", StatusCodes.BAD_REQUEST);

  const hashed = hashPaswword(req.body.password);

  const userEmail = await UserEmail.findOne({ email: req.body.email });
  if (userEmail) {
    throw new ErrorAPI("email_already_exists", StatusCodes.CONFLICT);
  }

  const user = await User.create({
    ...req.body,
    provider: "email",
  });

  await UserEmail.create({
    user: user._id,
    email: req.body.email,
    password: hashed,
  });

  res
    .json({
      success: true,
    })
    .status(StatusCodes.CREATED);
};

export const registerGithub = async (req: Request, res: Response) => {
  // Create User
  if (!req.body.providerId && !req.body.fullName)
    throw new BadRequest("providerId and fullName are required");

  const user = await User.create({
    fullName: req.body.fullName,
    providerId: req.body.providerId,
    provider: "github",
    role: "client",
    confirmed: true,
  });

  await UserProvider.create({
    user: user._id,
    providerId: req.body.providerId,
    provider: "github",
  });

  const { _id, fullName, confirmed, role, provider } = user;

  const accessToken = signAccessToken({
    id: _id.toString(),
    role,
    provider,
    providerId: req.body.providerId,
  });
  const refreshToken = await signRefreshToken({
    id: _id.toString(),
    provider,
    role,
    providerId: req.body.providerId,
  });

  const body = {
    _id,
    fullName,
    email: null,
    role,
    confirmed,
    provider,
    accessToken,
    accessTokenExpireDate: new Date(Date.now() + 15 * 60 * 1000),
    refreshToken,
    refreshTokenExpireDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  };

  res.status(StatusCodes.OK).json(body);
};

export const login = async (
  req: Request<{}, {}, { email?: string; password?: string }>,
  res: Response
) => {
  const { email, password } = req.body || {};
  if (!email || !password)
    throw new ErrorAPI("Invalid credentials", StatusCodes.BAD_REQUEST);

  const userEmail = await UserEmail.findOne({ email });
  if (!userEmail) {
    throw new Unauthorized("invalid_email_or_password");
  }

  if (!userEmail || !userEmail.password) {
    throw new Unauthorized("invalid_email_or_password");
  } else {
    if (!comparePassowrd(password, userEmail.password)) {
      throw new Unauthorized("invalid_email_or_password");
    } else {
      const user = await User.findById(userEmail.user);
      if (!user) throw new Unauthorized("invalid_email_or_password");

      const { _id, fullName, email, confirmed, role, provider } = user;

      const accessToken = signAccessToken({
        id: _id.toString(),
        email,
        role,
        provider,
      });
      const refreshToken = await signRefreshToken({
        id: _id.toString(),
        email,
        provider,
        role,
      });

      const existOtp = await OTP.findOne({ email });
      if (!confirmed && !existOtp) {
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
        role,
        confirmed,
        provider,
        accessToken,
        accessTokenExpireDate: new Date(Date.now() + 15 * 60 * 1000),
        refreshToken,
        refreshTokenExpireDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      };

      res.status(StatusCodes.OK).json(body);
    }
  }
};

export const githubCallback = async (req: Request, res: Response) => {
  if (typeof req.query.state !== "string" || !req.query.state)
    throw new Error("Invalid state");
  const state: {
    newAccountUrl: string;
    loginUrl: string;
    failureUrl: string;
  } = JSON.parse(req.query.state);

  try {
    const sessionUser = req.user as GitHubProfile;
    const profile = {
      fullName: sessionUser.fullName,
      providerId: sessionUser.providerId,
      provider: sessionUser.provider,
    };
    if (!profile) throw new Error("Failed to authenticate");

    let userProvider = await UserProvider.findOne({
      providerId: profile.providerId,
    });

    if (!userProvider) {
      res.redirect(
        `${state.newAccountUrl}?profile=${encodeURIComponent(
          JSON.stringify(profile)
        )}`
      );
    } else {
      const refreshToken = await signRefreshToken({
        id: userProvider.user.toString(),
        providerId: userProvider.providerId,
        provider: userProvider.provider,
        role: "client",
      });

      res.redirect(`${state.loginUrl}?token=${refreshToken}`);
    }
  } catch (ignore) {
    res.redirect(state.failureUrl);
  }
};

export const refreshAccessToken = async (
  req: Request<{}, {}, { token: string }>,
  res: Response
) => {
  const { sub, tokenId, user, ...payload } = await verifyUserToken(
    req.body.token
  );

  if (!tokenId) throw new Unauthorized();

  await Token.deleteOne({ uuid: tokenId });

  const accessToken = signAccessToken({ id: sub, ...payload });
  const refreshToken = await signRefreshToken({ id: sub, ...payload });

  const { _id, fullName, email, confirmed, role, provider } = user;

  const body = {
    _id,
    fullName,
    email,
    role,
    confirmed,
    provider,
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
  if (
    !req.currentUser ||
    !("email" in req.currentUser) ||
    req.currentUser.provider !== "email"
  )
    throw new Unauthorized();
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
  if (
    !req.currentUser ||
    !("email" in req.currentUser) ||
    req.currentUser.provider !== "email"
  )
    throw new Unauthorized();
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

export const resetPassword = async (req: Request, res: Response) => {
  if (
    !req.currentUser ||
    !("email" in req.currentUser) ||
    req.currentUser.provider !== "email"
  )
    throw new Unauthorized();

  const { email, purpose, tokenId } = req.currentUser;

  const { password } = req.body;

  if (!password) throw new BadRequest("password is required");

  if (purpose !== OTPPurpose.ResetPassword) throw new Unauthorized();

  const userEmail = await UserEmail.findOne({ email });
  if (!userEmail || !userEmail.password) throw new Unauthorized();

  if (comparePassowrd(password, userEmail.password))
    throw new ErrorAPI("same_password", StatusCodes.CONFLICT);

  const hashed = hashPaswword(req.body.password);
  userEmail.password = hashed;
  await userEmail.save();

  await Token.deleteOne({ uuid: tokenId });

  res.status(StatusCodes.OK).json({
    success: true,
  });
};
