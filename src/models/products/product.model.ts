import { model, Schema } from "mongoose";
import { IOffer, IProduct } from "../../types/products";

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
    type: Schema.Types.ObjectId,
    ref: "Offer",
  },
  brand: {
    type: Schema.Types.ObjectId,
    ref: "Brand",
  },
  subcategory: {
    type: Schema.Types.ObjectId,
    ref: "SubCategory",
  },
  labels: {
    type: [
      {
        type: Schema.Types.ObjectId,
        ref: "Label",
      },
    ],
    default: [],
  },
  tags: {
    type: [
      {
        type: Schema.Types.ObjectId,
        ref: "Tag",
      },
    ],
    default: [],
  },
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
  price: {
    type: Number,
    required: [true, "Price is required"],
    min: [0, "Price cannot be negative"],
  },
  finalPrice: {
    type: Number,
    default: function () {
      return (this as IProduct).price;
    },
  },
  employeeReadOnly: {
    type: Boolean,
    default: false,
  },
});

const Product = model<IProduct>("Product", ProductSchema);

export default Product;
