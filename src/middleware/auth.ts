import { NextFunction, Request, Response } from "express";
import Unauthorized from "../errors/unauthorized";
import { verifyUserToken } from "../utils/jwt";
import CustomError from "../errors/custom-error";
import { StatusCodes } from "http-status-codes";

export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const token = req.headers["authorization"]?.split("Bearer ")[1];
  if (!token) throw new Unauthorized();

  const payload = await verifyUserToken(token);

  // prevent refresh token from being used as access token
  // if have uuid and no puprose, it's a refresh token
  if (typeof payload.tokenId === "string" && !payload.purpose)
    throw new Unauthorized();

  const { user, ...rest } = payload;
  req.currentUser = rest;

  next();
};

export const staffMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!["admin", "employee"].includes(req.currentUser?.role || "")) {
    throw new CustomError(
      "Only staff members can access this resource",
      StatusCodes.FORBIDDEN
    );
  }
  next();
};
