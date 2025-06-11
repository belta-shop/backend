import { model, Schema } from "mongoose";

const TagSchema = new Schema({
  nameAr: {
    type: String,
    required: [true, "Arabic name is required"],
    trim: true,
  },
  nameEn: {
    type: String,
    required: [true, "English name is required"],
    trim: true,
  },
  products: [
    {
      type: Schema.Types.ObjectId,
      ref: "Product",
    },
  ],
});

const Tag = model("Tag", TagSchema);

export default Tag;
