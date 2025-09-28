import { model, Schema } from "mongoose";
import { emailRegex } from "../../config/regex";

const UserSchema = new Schema(
  {
    fullName: {
      type: String,
      required: [true, "Full name is required"],
      trim: true,
    },
    email: {
      type: String,
      match: [emailRegex, "Please enter a valid email"],
      default: null,
    },
    provider: {
      type: String,
      enum: {
        values: ["email", "github"],
        message: "{VALUE} is not supported",
      },
      default: "email",
    },
    providerId: {
      type: String,
      default: null,
    },
    confirmed: {
      type: Boolean,
      default: false,
    },
    role: {
      type: String,
      enum: {
        values: ["client", "employee", "admin"],
        message: "{VALUE} is not supported",
      },
      required: [true, "Role is required"],
    },
  },
  { timestamps: true }
);

const User = model("User", UserSchema);

export default User;
