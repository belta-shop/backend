import { NextFunction, Request, Response } from "express";
import Unauthorized from "../errors/unauthorized";
import { verifyToken, verifyUserToken } from "../utils/jwt";
import User from "../models/user.model";

export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const token = req.headers["authorization"]?.split("Bearer ")[1];
  if (!token) throw new Unauthorized();

  // IN DEVELOPMENT, pass user neither using valid token or userId as token
  const unknownPayload = await verifyToken(token);
  const isTokenInvalid = !unknownPayload;
  if (isTokenInvalid && process.env.NODE_ENV === "development") {
    const user = await User.findById(token);
    if (!user) throw new Unauthorized();
    req.currentUser = { sub: user.id, email: user.email, role: user.role };
    next();
    return;
  }

  const payload = await verifyUserToken(token);

  // prevent refresh token from being used as access token
  // if have uuid and no puprose, it's a refresh token
  if (typeof payload.tokenId === "string" && !payload.purpose)
    throw new Unauthorized();

  req.currentUser = payload;

  next();
};

export const staffMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!["admin", "employee"].includes(req.currentUser?.role || "")) {
    throw new Unauthorized("Only staff members can access this resource");
  }
  next();
};
