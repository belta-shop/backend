import { Queue, Worker } from "bullmq";
import { bullConnection } from "../config/bullmq";
import DraftCart from "../models/carts/draft-cart.model";
import CustomError from "../errors/custom-error";
import Product from "../models/products/product.model";
import { StatusCodes } from "http-status-codes";
import ActiveCart from "../models/carts/active-cart.model";
import { ObjectId } from "mongoose";
import { DraftCartProductReason } from "../types/cart";

const queue = new Queue("remove-product-from-carts", {
  connection: bullConnection,
});
export const removeProductFromCartsQueue = queue;

export const addJobToRemoveProductFromCarts = async (
  productId: string,
  reason: DraftCartProductReason
) => {
  await queue.add("remove-product-from-carts", { productId, reason });
};

new Worker(
  queue.name,
  async (job) => {
    const product = await Product.findById(job.data.productId);

    if (!product)
      throw new CustomError("Product not found", StatusCodes.NOT_FOUND);

    job.log(`Found Product: ${product?.nameAr} - ${product?.nameEn}`);
    job.updateProgress(25);

    const activeCarts = await ActiveCart.find({
      "products.productId": product._id,
    });

    job.log(
      `Found ${activeCarts.length} active carts that contain the product`
    );
    job.updateProgress(50);

    for (const activeCart of activeCarts) {
      // Find the product in the active cart
      const productIndex = activeCart.products.findIndex(
        (p) => p.productId.toString() === (product._id as ObjectId).toString()
      );

      if (productIndex === -1) continue;
      const cartProduct = activeCart.products[productIndex];

      // Remove the product from the active cart
      activeCart.products.splice(productIndex, 1);
      await activeCart.save();

      // Find or create the user's draft cart
      let draftCart = await DraftCart.findOne({ user: activeCart.user });
      if (!draftCart) {
        draftCart = await DraftCart.create({
          user: activeCart.user,
        });
      }

      // Add the product to the draft cart with the same quantity and a reason
      draftCart.products.push({
        productId: product._id,
        nameAr: product.nameAr,
        nameEn: product.nameEn,
        cover: product.coverList[0],
        itemPrice: product.finalPrice,
        quantity: cartProduct.quantity,
        totalPrice: product.finalPrice * cartProduct.quantity,
        reason: job.data.reason,
      });

      await draftCart.save();

      job.log(`Product moved for user ${activeCart.user}`);
    }
    job.log("All products moved");
    job.updateProgress(100);
  },
  {
    connection: bullConnection,
  }
);
