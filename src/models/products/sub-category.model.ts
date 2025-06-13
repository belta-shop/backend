import { model, Schema } from "mongoose";
import ErrorAPI from "../../errors/error-api";
import { StatusCodes } from "http-status-codes";

const SubCategorySchema = new Schema(
  {
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
    employeeReadOnly: {
      type: Boolean,
      default: false,
    },
    category: {
      type: Schema.Types.ObjectId,
      ref: "Category",
    },
    products: [
      {
        type: Schema.Types.ObjectId,
        ref: "Product",
      },
    ],
  },
  { timestamps: true }
);

// Prevent deletion if subcategory has products
SubCategorySchema.pre("deleteOne", { document: true }, async function (next) {
  const productsCount = await this.model("Product").countDocuments({
    subcategory: this._id,
  });
  if (productsCount > 0) {
    throw new ErrorAPI("subcategory_has_products", StatusCodes.CONFLICT);
  }
  next();
});

const SubCategory = model("SubCategory", SubCategorySchema);

export default SubCategory;
