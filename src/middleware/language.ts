import { Request, Response, NextFunction } from "express";
import { DEFAULT_LANGUAGE, allLanguages } from "../config/global";

export const languageMiddleware = (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  const acceptLanguage = req.headers["accept-language"] || "";
  const lang =
    allLanguages.find((l) => acceptLanguage.toLowerCase().startsWith(l)) ||
    DEFAULT_LANGUAGE;

  req.lang = lang;
  next();
};
