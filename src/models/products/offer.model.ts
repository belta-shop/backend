import { model, Schema, Document } from "mongoose";

interface IOffer extends Document {
  nameAr?: string;
  nameEn?: string;
  type: "percent" | "fixed";
  value: number;
}

const OfferSchema = new Schema({
  nameAr: {
    type: String,
    trim: true,
  },
  nameEn: {
    type: String,
    trim: true,
  },
  products: [
    {
      type: Schema.Types.ObjectId,
      ref: "Product",
    },
  ],
  offerQuantity: {
    type: Number,
    required: [true, "Offer quantity is required"],
    min: [1, "Offer quantity must be at least 1"],
  },
  maxPerClient: {
    type: Number,
    required: [true, "Max per client is required"],
    min: [1, "Max per client must be at least 1"],
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  type: {
    type: String,
    enum: {
      values: ["percent", "fixed"],
      message: "Invalid offer type",
    },
    required: [true, "Offer type is required"],
  },
  value: {
    type: Number,
    required: [true, "Offer value is required"],
    validate: {
      validator: function (this: IOffer, value: number) {
        if (this.type === "percent") {
          return value >= 0.01 && value <= 0.95;
        }
        return value >= 1;
      },
      message: "Invalid offer value for the selected type",
    },
  },
});

// Validate that if one name is provided, the other must be provided too
OfferSchema.pre("save", function (this: IOffer, next) {
  if ((this.nameAr && !this.nameEn) || (!this.nameAr && this.nameEn)) {
    throw new Error("Both Arabic and English names must be provided together");
  }
  next();
});

const Offer = model<IOffer>("Offer", OfferSchema);

export default Offer;
