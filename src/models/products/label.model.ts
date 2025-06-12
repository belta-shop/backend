import { model, Schema } from "mongoose";

const LabelSchema = new Schema({
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
  color: {
    type: String,
    required: [true, "Color is required"],
    trim: true,
  },
  products: [
    {
      type: Schema.Types.ObjectId,
      ref: "Product",
    },
  ],
  employeeReadOnly: {
    type: Boolean,
    default: false,
  },
});

const Label = model("Label", LabelSchema);

export default Label;
