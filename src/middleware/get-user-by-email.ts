import { Request, Response, NextFunction } from "express";
import User from "../models/user.model";
import { StatusCodes } from "http-status-codes";
import ErrorAPI from "../errors/error-api";

export const getUserByEmailMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (!user) throw new ErrorAPI("no_user_with_email", StatusCodes.NOT_FOUND);

  req.currentUser = {
    email,
    sub: user._id.toString(),
    role: user.role,
  };

  next();
};
