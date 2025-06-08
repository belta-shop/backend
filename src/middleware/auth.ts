import { NextFunction, Request, Response } from "express";
import Unauthorized from "../errors/unauthorized";
import { verifyUserToken } from "../utils/jwt";

export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const token = req.headers["authorization"]?.split("Bearer ")[1];
  if (!token) throw new Unauthorized();

  const payload = await verifyUserToken(token);

  // prevent refresh token from being used as access token
  if (typeof payload.tokenId === "string") throw new Unauthorized();

  req.currentUser = payload;

  next();
};
