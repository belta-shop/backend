import { StatusCodes } from "http-status-codes";
import CustomError from "./custom-error";

export default class BadRequest extends CustomError {
  constructor(message: string) {
    super(message, StatusCodes.BAD_REQUEST);
  }
}
