import { model, Schema } from "mongoose";
import { DraftCartProductReason } from "../../types/cart";

const draftCartSchema = new Schema(
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
          reason: {
            type: String,
            enum: [
              DraftCartProductReason.PriceChange,
              DraftCartProductReason.OutOfStock,
            ],
            default: null,
          },
        },
      ],
      default: [],
    },
  },
  { timestamps: true }
);

const DraftCart = model("DraftCart", draftCartSchema);

export default DraftCart;
