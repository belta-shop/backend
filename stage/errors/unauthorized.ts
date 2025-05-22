import { StatusCodes } from "http-status-codes";
import CustomError from "./custom-error";

export default class Unauthorized extends CustomError {
  constructor() {
    super("unauthorized", StatusCodes.UNAUTHORIZED);
  }
}
