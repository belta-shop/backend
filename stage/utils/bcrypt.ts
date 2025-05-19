import bcrypt from "bcryptjs";
import { SALT_ROUNDS } from "../config/global";

export function hashPaswword(pass: string) {
  const salt = bcrypt.genSaltSync(SALT_ROUNDS);
  return bcrypt.hashSync(pass, salt);
}

export function comparePassowrd(
  regularPassword: string,
  hashedPassword: string
) {
  return bcrypt.compareSync(regularPassword, hashedPassword);
}

export function genOTP() {
  return Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, "0");
}
