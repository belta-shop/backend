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
