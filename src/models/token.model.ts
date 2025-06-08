import { model, Schema } from "mongoose";
import { REFRESH_TOKEN_EXPIRE_TIME } from "../config/global";

const TokenSchema = new Schema({
  uuid: {
    type: String,
    required: [true, "uuid is required"],
    index: {
      unique: true,
    },
  },
  value: {
    type: String,
    required: [true, "token is required"],
  },
  expireAt: {
    type: Date,
    default: () => new Date(Date.now() + REFRESH_TOKEN_EXPIRE_TIME),
    expires: 10,
  },
});

const Token = model("Token", TokenSchema);

export default Token;
