import { model, Schema } from "mongoose";

const activeCartSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      index: { unique: true },
      required: true,
    },
    products: {
      type: [
        {
          productId: {
            type: Schema.Types.ObjectId,
            ref: "Product",
            required: true,
          },
          nameAr: { type: String, required: true },
          nameEn: { type: String, required: true },
          cover: { type: String, required: true },
          quantity: { type: Number, required: true },
          itemPrice: { type: Number, required: true },
          totalPrice: { type: Number, default: 0 },
        },
      ],
      default: [],
    },
    finalPrice: { type: Number, default: 0 }, // after applying discounts when exists
  },
  { timestamps: true }
);

const ActiveCart = model("ActiveCart", activeCartSchema);

export default ActiveCart;
