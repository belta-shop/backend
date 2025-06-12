import { model, Schema } from "mongoose";
import ErrorAPI from "../../errors/error-api";
import { StatusCodes } from "http-status-codes";

const BrandSchema = new Schema({
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
  cover: {
    type: String,
    required: [true, "Cover image is required"],
  },
  disabled: {
    type: Boolean,
    default: false,
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

// Prevent deletion if brand has products
BrandSchema.pre("deleteOne", { document: true }, async function (next) {
  const productsCount = await this.model("Product").countDocuments({
    brand: this._id,
  });
  if (productsCount > 0) {
    throw new ErrorAPI("brand_has_products", StatusCodes.CONFLICT);
  }
  next();
});

const Brand = model("Brand", BrandSchema);

export default Brand;
