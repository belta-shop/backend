import { model, Schema } from "mongoose";
import ErrorAPI from "../../errors/error-api";
import { StatusCodes } from "http-status-codes";

const CategorySchema = new Schema({
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
  subcategories: [
    {
      type: Schema.Types.ObjectId,
      ref: "SubCategory",
    },
  ],
});

// Prevent deletion if category has subcategories
CategorySchema.pre("deleteOne", { document: true }, async function (next) {
  const subcategoriesCount = await this.model("SubCategory").countDocuments({
    category: this._id,
  });
  if (subcategoriesCount > 0) {
    throw new ErrorAPI("category_has_subcategories", StatusCodes.CONFLICT);
  }
  next();
});

const Category = model("Category", CategorySchema);

export default Category;
