import jwt, { SignOptions, VerifyOptions } from "jsonwebtoken";
import { UserJWTPayload } from "../types/auth";
import User from "../models/user.model";
import Unauthorized from "../errors/unauthorized";

import { v4 as uuidv4 } from "uuid";
import Token from "../models/token.model";
import {
  ACCESS_TOKEN_EXPIRE_TIME,
  REFRESH_TOKEN_EXPIRE_TIME,
} from "../config/global";
import { OTPPurpose } from "../types/otp";

export function signToken(data: any, options?: SignOptions) {
  return jwt.sign(data, process.env.JWT_SECRET!, options);
}

export function signAccessToken({
  id,
  email,
  role,
  ...payload
}: {
  id: string;
  email: string;
  role: string;
} & Record<string, any>) {
  return signToken(
    { sub: id, email, role, ...payload },
    {
      expiresIn: `${ACCESS_TOKEN_EXPIRE_TIME}ms`,
    }
  );
}

export async function signRefreshToken({
  id,
  email,
  role,
}: {
  id: string;
  email: string;
  role: string;
}) {
  const tokenId = uuidv4();

  const token = signToken(
    { sub: id, tokenId, email, role },
    {
      expiresIn: `${REFRESH_TOKEN_EXPIRE_TIME}ms`,
    }
  );

  await Token.create({
    uuid: tokenId,
    value: token,
  });

  return token;
}

export async function signPurposeToken({
  id,
  email,
  role,
  purpose,
}: {
  id: string;
  email: string;
  role: string;
  purpose: OTPPurpose;
} & Record<string, any>) {
  const tokenId = uuidv4();

  const token = signToken(
    { sub: id, tokenId, email, role, purpose },
    {
      expiresIn: `${ACCESS_TOKEN_EXPIRE_TIME}ms`,
    }
  );

  await Token.create({
    uuid: tokenId,
    value: token,
  });

  return token;
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

  const { sub: id, tokenId, email, role } = payload;

  // if it has a uuid, check if it still valid
  if (tokenId) {
    const dbToken = await Token.findOne({ uuid: tokenId }).exec();
    if (!dbToken || dbToken.value !== token) throw new Unauthorized();
  }

  const user = await User.findById(id).select("-password");
  if (!user || user.email !== email || user.role !== role)
    throw new Unauthorized();

  return { ...payload, user };
}
