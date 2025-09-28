import { StatusCodes } from "http-status-codes";
import CustomError from "../errors/custom-error";
import User from "../models/auth/user.model";

export const checkIfClient = async (userId: string, role?: string) => {
  let currentRole = role;

  if (!currentRole) {
    const user = await User.findById(userId);
    currentRole = user?.role;
  }

  if (currentRole !== "client")
    throw new CustomError(
      "This action is not allowed for this user",
      StatusCodes.FORBIDDEN
    );
};
