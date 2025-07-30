import { StatusCodes } from "http-status-codes";
import CustomError from "../../errors/custom-error";
import Product from "../../models/products/product.model";
import ActiveCart from "../../models/carts/active-cart.model";
import { ObjectId } from "mongoose";
import DraftCart from "../../models/carts/draft-cart.model";
import { DraftCartProductReason } from "../../types/cart";
import { checkIfClient } from "../../utils/users";

export const getCart = async ({
  userId,
  role,
}: {
  userId: string;
  role?: string;
}) => {
  await checkIfClient(userId, role);

  let activeCart = await ActiveCart.findOne({ user: userId });

  if (!activeCart) activeCart = await ActiveCart.create({ user: userId });

  return activeCart;
};

export const addProduct = async ({
  userId,
  productId,
  quantity,
  role,
}: {
  userId: string;
  productId: string;
  quantity: number;
  role?: string;
}) => {
  await checkIfClient(userId, role);

  const product = await Product.findById(productId);

  if (!product)
    throw new CustomError("Product not found", StatusCodes.NOT_FOUND);

  let activeCart = await ActiveCart.findOne({ user: userId });

  if (!activeCart) activeCart = await ActiveCart.create({ user: userId });

  const productIndex = activeCart.products.findIndex(
    (product) => product.productId.toString() === productId
  );
  const totalPrice = product.finalPrice * quantity;

  if (productIndex === -1) {
    // Not in Cart => add new one
    activeCart.products.push({
      productId,
      cover: product.coverList[0],
      nameAr: product.nameAr,
      nameEn: product.nameEn,
      quantity,
      itemPrice: product.finalPrice,
      totalPrice,
    });

    activeCart.finalPrice += totalPrice;
  } else {
    // In Cart => update quantity
    activeCart.products[productIndex].quantity += quantity;
    activeCart.products[productIndex].totalPrice += totalPrice;
    activeCart.finalPrice += totalPrice;
  }

  activeCart.save();

  return activeCart;
};

export const addMultiProduct = async ({
  userId,
  role,
  items,
}: {
  userId: string;
  role?: string;
  items: {
    productId: string;
    quantity: number;
  }[];
}) => {
  await checkIfClient(userId, role);

  let activeCart = await ActiveCart.findOne({ user: userId });

  if (!activeCart) activeCart = await ActiveCart.create({ user: userId });

  await Promise.all(
    items.map(async ({ productId, quantity }) => {
      const product = await Product.findById(productId);
      if (!product) return;

      const productIndex = activeCart.products.findIndex(
        (product) => product.productId.toString() === productId
      );

      const totalPrice = product.finalPrice * quantity;

      if (productIndex === -1) {
        // Not in Cart => add new one
        activeCart.products.push({
          productId,
          cover: product.coverList[0],
          nameAr: product.nameAr,
          nameEn: product.nameEn,
          quantity,
          itemPrice: product.finalPrice,
          totalPrice,
        });

        activeCart.finalPrice += totalPrice;
      } else {
        // In Cart => update quantity
        activeCart.products[productIndex].quantity += quantity;
        activeCart.products[productIndex].totalPrice += totalPrice;
        activeCart.finalPrice += totalPrice;
      }
    }, [])
  );

  activeCart.save();

  return activeCart;
};

export const removeProduct = async ({
  userId,
  productId,
  quantity,
  role,
}: {
  userId: string;
  productId: string;
  quantity: number;
  role?: string;
}) => {
  await checkIfClient(userId, role);

  let activeCart = await ActiveCart.findOne({ user: userId });

  if (!activeCart) activeCart = await ActiveCart.create({ user: userId });

  const productIndex = activeCart.products.findIndex(
    (product) => product.productId.toString() === productId
  );

  // Not in Cart => change nothing
  if (productIndex === -1) return activeCart;

  const product = activeCart.products[productIndex];

  if (product.quantity > quantity) {
    // Decrease quantity
    product.quantity -= quantity;
    const diffPrice = product.itemPrice * quantity;
    product.totalPrice -= diffPrice;
    activeCart.finalPrice -= diffPrice;
  } else {
    // Remove product
    activeCart.finalPrice -= product.totalPrice;
    activeCart.products.splice(productIndex, 1);
  }

  await activeCart.save();

  return activeCart;
};

export const moveProductToDraft = async ({
  productId,
  reason,
}: {
  productId: ObjectId;
  reason: DraftCartProductReason;
}) => {
  const product = await Product.findById(productId);

  if (!product)
    throw new CustomError("Product not found", StatusCodes.NOT_FOUND);

  const activeCarts = await ActiveCart.find({
    "products.productId": product._id,
  });

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
      reason,
    });

    await draftCart.save();
  }
};

export const clearCart = async ({
  userId,
  role,
}: {
  userId: string;
  role?: string;
}) => {
  const cart = await getCart({ userId, role });

  cart.products = [] as any;
  cart.finalPrice = 0;
  await cart.save();
};
