import { NextFunction, Request, Response } from "express";
import ErrorAPI from "../errors/error-api";
import { StatusCodes } from "http-status-codes";
import { t } from "../utils/translate";
import { allLanguages } from "../config/global";
import { Language } from "../types/language";
import { MongooseError } from "mongoose";

export const ErrorHandler = async (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const customError = {
    msg: t(error.message, req.headers["accept-language"]),
    code: StatusCodes.INTERNAL_SERVER_ERROR,
  };

  if (error instanceof ErrorAPI) customError.code = error.status;
  if (error instanceof MongooseError)
    customError.code = StatusCodes.BAD_REQUEST;

  res.status(customError.code).json({ error: customError.msg });
};
