import { StatusCodes } from "http-status-codes";
import CustomError from "../../errors/custom-error";
import Product from "../../models/products/product.model";
import DraftCart from "../../models/carts/draft-cart.model";
import { checkIfClient } from "../../utils/users";

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

  let activeCart = await DraftCart.findOne({ user: userId });

  if (!activeCart) activeCart = await DraftCart.create({ user: userId });

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
      } else {
        // In Cart => update quantity
        activeCart.products[productIndex].quantity += quantity;
        activeCart.products[productIndex].totalPrice += totalPrice;
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
