import { model, Schema } from "mongoose";
import { IOffer } from "../../types/products";
import Product from "./product.model";

const OfferSchema = new Schema(
  {
    nameAr: {
      type: String,
      trim: true,
    },
    nameEn: {
      type: String,
      trim: true,
    },
    product: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: [true, "Product is required"],
    },
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
    quantityPurchased: {
      type: Number,
      default: 0,
      min: [0, "Quantity purchased cannot be negative"],
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
    employeeReadOnly: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Validate that if one name is provided, the other must be provided too
OfferSchema.pre("save", function (this: IOffer, next) {
  if ((this.nameAr && !this.nameEn) || (!this.nameAr && this.nameEn)) {
    throw new Error("Both Arabic and English names must be provided together");
  }

  next();
});

// Calculate discounted price based on offer type and value
OfferSchema.methods.calculateDiscountedPrice = function (
  originalPrice: number
): number {
  if (this.type === "percent") {
    return originalPrice * (1 - this.value);
  }
  return originalPrice - this.value;
};

// Check if offer is valid (not disabled and quantity limit not reached)
OfferSchema.methods.isValid = function (): boolean {
  return !this.disabled && this.quantityPurchased < this.offerQuantity;
};

// Calculate final price for a product
OfferSchema.methods.calculateFinalPrice = async function () {
  const product = await Product.findById(this.product);

  if (!product) return;

  const { price: originalPrice, minPrice } = product;

  if (!this.isValid()) {
    product.finalPrice = originalPrice;
  }

  const discountedPrice = this.calculateDiscountedPrice(originalPrice);
  product.finalPrice = Math.max(discountedPrice, minPrice);

  await product.save();
};

const Offer = model<IOffer>("Offer", OfferSchema);

export default Offer;
