import { Language } from "../types/language";

export const SALT_ROUNDS = 10;

export const DEFAULT_LANGUAGE: Language = "ar";
export const allLanguages: Language[] = ["ar", "en"];

export const OTP_EXPIRE_TIME = 10 * 60 * 1000; // 10 minutes

export const REFRESH_TOKEN_EXPIRE_TIME = 7 * 24 * 60 * 60 * 1000; // 1 week
export const ACCESS_TOKEN_EXPIRE_TIME = 30 * 60 * 1000; // 30 minutes
