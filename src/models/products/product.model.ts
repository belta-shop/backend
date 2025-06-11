import { model, Schema } from "mongoose";
import { IProduct } from "../../types/products";

const ProductSchema = new Schema({
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
  descriptionAr: {
    type: String,
    required: [true, "Arabic description is required"],
    trim: true,
  },
  descriptionEn: {
    type: String,
    required: [true, "English description is required"],
    trim: true,
  },
  coverList: [
    {
      type: String,
      required: [true, "At least one cover image is required"],
    },
  ],
  rating: {
    type: Number,
    default: 0,
    min: [0, "Rating cannot be negative"],
    max: [5, "Rating cannot exceed 5"],
  },
  reviews: {
    type: Number,
    default: 0,
    min: [0, "Reviews count cannot be negative"],
  },
  viewsCount: {
    type: Number,
    default: 0,
    min: [0, "Views count cannot be negative"],
  },
  ordersCount: {
    type: Number,
    default: 0,
    min: [0, "Orders count cannot be negative"],
  },
  purchaseCount: {
    type: Number,
    default: 0,
    min: [0, "Purchase count cannot be negative"],
  },
  returnCount: {
    type: Number,
    default: 0,
    min: [0, "Return count cannot be negative"],
  },
  offer: {
    offer: {
      type: Schema.Types.ObjectId,
      ref: "Offer",
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
  },
  brand: {
    type: Schema.Types.ObjectId,
    ref: "Brand",
    required: [true, "Brand is required"],
  },
  subcategory: {
    type: Schema.Types.ObjectId,
    ref: "SubCategory",
    required: [true, "Subcategory is required"],
  },
  labels: [
    {
      type: Schema.Types.ObjectId,
      ref: "Label",
    },
  ],
  tags: [
    {
      type: Schema.Types.ObjectId,
      ref: "Tag",
    },
  ],
  quantity: {
    type: Number,
    required: [true, "Quantity is required"],
    min: [0, "Quantity cannot be negative"],
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  minPrice: {
    type: Number,
    required: [true, "Minimum price is required"],
    min: [0, "Minimum price cannot be negative"],
  },
});

const Product = model<IProduct>("Product", ProductSchema);

export default Product;
