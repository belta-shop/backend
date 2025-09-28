import { model, Schema } from "mongoose";

const UserProviderSchema = new Schema({
  provider: {
    type: String,
    enum: {
      values: ["github"],
      message: "{VALUE} is not supported",
    },
    required: [true, "Provider is required"],
  },
  providerId: {
    type: String,
    index: {
      unique: true,
    },
    required: [true, "Provider ID is required"],
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: [true, "User is required"],
    unique: true,
  },
});

const UserProvider = model("UserProvider", UserProviderSchema);

export default UserProvider;
