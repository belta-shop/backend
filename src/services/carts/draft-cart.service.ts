import { StatusCodes } from "http-status-codes";
import CustomError from "../../errors/custom-error";
import Product from "../../models/products/product.model";
import User from "../../models/user.model";
import DraftCart from "../../models/carts/draft-cart.model";

const checkIfClient = async (userId: string, role?: string) => {
  let currentRole = role;

  if (!currentRole) {
    const user = await User.findById(userId);
    currentRole = user?.role;
  }

  if (currentRole !== "client")
    throw new CustomError(
      "Active carts are not allowed for this user",
      StatusCodes.FORBIDDEN
    );
};

export const getCart = async ({
  userId,
  role,
}: {
  userId: string;
  role?: string;
}) => {
  await checkIfClient(userId, role);

  let draftCart = await DraftCart.findOne({ user: userId });

  if (!draftCart) draftCart = await DraftCart.create({ user: userId });

  return draftCart;
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

  let draftCart = await DraftCart.findOne({ user: userId });

  if (!draftCart) draftCart = await DraftCart.create({ user: userId });

  const productIndex = draftCart.products.findIndex(
    (product) => product.productId.toString() === productId
  );
  const totalPrice = product.finalPrice * quantity;

  if (productIndex === -1) {
    // Not in Cart => add new one
    draftCart.products.push({
      productId,
      cover: product.coverList[0],
      nameAr: product.nameAr,
      nameEn: product.nameEn,
      quantity,
      itemPrice: product.finalPrice,
      totalPrice,
    });
  } else {
    // In Cart => update quantity
    draftCart.products[productIndex].quantity += quantity;
    draftCart.products[productIndex].totalPrice += totalPrice;
  }

  draftCart.save();

  return draftCart;
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

  let draftCart = await DraftCart.findOne({ user: userId });

  if (!draftCart) draftCart = await DraftCart.create({ user: userId });

  const productIndex = draftCart.products.findIndex(
    (product) => product.productId.toString() === productId
  );

  // Not in Cart => change nothing
  if (productIndex === -1) return draftCart;

  const product = draftCart.products[productIndex];

  if (product.quantity > quantity) {
    // Decrease quantity
    product.quantity -= quantity;
    const diffPrice = product.itemPrice * quantity;
    product.totalPrice -= diffPrice;
  } else {
    // Remove product
    draftCart.products.splice(productIndex, 1);
  }

  await draftCart.save();

  return draftCart;
};
