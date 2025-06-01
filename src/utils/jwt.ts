import jwt, { SignOptions, VerifyOptions } from "jsonwebtoken";
import { UserJWTPayload } from "../types/auth";
import User from "../models/user.model";
import Unauthorized from "../errors/unauthorized";

export function signToken(data: any, options?: SignOptions) {
  return jwt.sign(data, process.env.JWT_SECRET!, options);
}

export async function verifyToken<ExpectedPayload>(
  token: string,
  options?: VerifyOptions
): Promise<ExpectedPayload | null> {
  try {
    return jwt.verify(
      token,
      process.env.JWT_SECRET!,
      options
    ) as ExpectedPayload;
  } catch (e) {
    return null;
  }
}

export async function verifyUserToken(token: string) {
  const payload = await verifyToken<UserJWTPayload>(token);

  if (!payload) throw new Unauthorized();

  const { sub: id, email, role } = payload;

  const user = await User.findById(id).select("-password");
  if (!user || user.email !== email || user.role !== role)
    throw new Unauthorized();

  return { ...payload, user };
}
