import { model, Schema } from "mongoose";
import { emailRegex } from "../../config/regex";

const UserEmailSchema = new Schema({
  email: {
    type: String,
    required: [true, "Email is required"],
    match: [emailRegex, "Please enter a valid email"],
    index: {
      unique: true,
    },
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: "User",
    unique: true,
    required: [true, "User is required"],
  },
  password: {
    type: String,
    required: [true, "Password is required"],
  },
});

const UserEmail = model("UserEmail", UserEmailSchema);

export default UserEmail;
