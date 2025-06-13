import { model, Schema } from "mongoose";

const metadataSchema = new Schema({
  blobName: { type: String, required: true },
  originalname: { type: String, required: true },
  fileType: { type: String, required: true },
  size: { type: Number, required: true },
});

export const Metadata = model("Metadata", metadataSchema);
