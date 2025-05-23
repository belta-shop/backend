import { NextFunction, Request, Response } from "express";
import ErrorAPI from "../errors/error-api";
import { StatusCodes } from "http-status-codes";
import { t } from "../utils/translate";
import { MongooseError } from "mongoose";
import CustomError from "../errors/custom-error";

export const ErrorHandler = async (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const customError = {
    msg: error.message,
    code: StatusCodes.INTERNAL_SERVER_ERROR,
  };

  if (error instanceof CustomError) customError.code = error.status;
  if (error instanceof MongooseError)
    customError.code = StatusCodes.BAD_REQUEST;

  if (error instanceof ErrorAPI || error instanceof MongooseError)
    customError.msg = t(
      `Error.${error.message}`,
      req.headers["accept-language"]
    );

  res.status(customError.code).json({ error: customError.msg });
};
