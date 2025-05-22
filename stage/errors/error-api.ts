import CustomError from "./custom-error";

export default class ErrorAPI extends CustomError {
  constructor(message: string, status: number) {
    super(message, status);
  }
}
