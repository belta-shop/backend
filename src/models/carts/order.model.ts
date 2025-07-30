import { model, Schema } from "mongoose";
import { OrderStatus } from "../../types/cart";

const OrderSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      index: true,
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
    status: {
      type: String,
      enum: [
        OrderStatus.Confirmed,
        OrderStatus.Delivered,
        OrderStatus.Cancelled,
      ],
      default: OrderStatus.Confirmed,
    },
    sessionId: { type: String, default: null },
  },
  { timestamps: true }
);

const Order = model("Order", OrderSchema);

export default Order;
