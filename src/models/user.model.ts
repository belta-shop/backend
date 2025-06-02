import { model, MongooseError, Schema } from "mongoose";
import { emailRegex } from "../config/regex";
import ErrorAPI from "../errors/error-api";
import { StatusCodes } from "http-status-codes";

const UserSchema = new Schema({
  fullName: {
    type: String,
    required: [true, "Full name is required"],
    trim: true,
  },
  email: {
    type: String,
    required: [true, "Email is required"],
    match: [emailRegex, "Please enter a valid email"],
    index: {
      unique: true,
    },
  },
  confirmed: {
    type: Boolean,
    default: false,
  },
  password: {
    type: String,
    required: [true, "Password is required"],
  },
  role: {
    type: String,
    enum: ["client", "seller", "admin"],
    required: [true, "Role is required"],
  },
});

UserSchema.post("save", function (error: any, doc: any, next: any) {
  if (error.code === 11000) {
    next(new ErrorAPI("duplicate_email_error", StatusCodes.CONFLICT));
  } else {
    next(error);
  }
});

const User = model("User", UserSchema);

export default User;
