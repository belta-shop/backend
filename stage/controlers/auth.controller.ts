import { Request, Response } from "express";
import User from "../models/user.model";
import { StatusCodes } from "http-status-codes";
import { MongooseError } from "mongoose";
import ErrorAPI from "../errors/error-api";
import { comparePassowrd, hashPaswword } from "../utils/bcrypt";
import { signToken, verifyUserToken } from "../utils/jwt";

export const register = async (req: Request, res: Response) => {
  try {
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
        refreshToken,
      };

      res.status(StatusCodes.OK).json(body);
    }
  }
};

export const refreshAccessToken = async (
  req: Request<{}, {}, { token: string }>,
  res: Response
) => {
  const { sub, email, role } = await verifyUserToken(req.body.token);

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

  res.status(StatusCodes.CREATED).json({ accessToken, refreshToken });
};
