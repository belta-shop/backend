import { model, Schema } from "mongoose";
import { emailRegex } from "../config/regex";

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
      unique: [true, "duplicate_email_error"],
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

const User = model("User", UserSchema);

export default User;
