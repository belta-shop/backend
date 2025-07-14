import { Request, Response } from "express";
import { getPagination } from "../../utils/routes";
import DraftCart from "../../models/carts/draft-cart.model";
import {
  emptyPaginationList,
  getAggregatedLookup,
  getPaginationPipline,
} from "../../utils/models";
import { StatusCodes } from "http-status-codes";
import Product from "../../models/products/product.model";
import CustomError from "../../errors/custom-error";
import User from "../../models/user.model";
import { DraftCartProductReason } from "../../types/cart";

export const getDraftCart = async (req: Request, res: Response) => {
  const userId = req.currentUser?.sub;

  if (req.currentUser?.role !== "client")
    throw new CustomError(
      "Carts are not allowed for this user",
      StatusCodes.FORBIDDEN
    );

  let draftCart = await DraftCart.findOne({ user: userId });

  if (!draftCart) {
    draftCart = await DraftCart.create({ user: userId });
  }

  res.status(StatusCodes.OK).json(draftCart);
};

export const addProductToDraftCart = async (req: Request, res: Response) => {
  const userId = req.currentUser?.sub;

  if (req.currentUser?.role !== "client")
    throw new CustomError(
      "Carts are not allowed for this user",
      StatusCodes.FORBIDDEN
    );

  const { productId, quantity } = req.body;

  const product = await Product.findById(productId);

  if (!product) {
    throw new CustomError("Product not found", StatusCodes.NOT_FOUND);
  }

  let draftCart = await DraftCart.findOne({ user: userId });

  if (!draftCart) draftCart = await DraftCart.create({ user: userId });

  const productIndex = draftCart.products.findIndex(
    (product) => product.productId.toString() === productId
  );

  const totalPrice = product.finalPrice * quantity;
  if (productIndex === -1) {
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
    draftCart.products[productIndex].quantity += quantity;
    draftCart.products[productIndex].totalPrice += totalPrice;
  }

  draftCart.save();

  res.status(StatusCodes.OK).json(draftCart);
};

export const removeProductFromDraftCart = async (
  req: Request,
  res: Response
) => {
  const userId = req.currentUser?.sub;

  if (req.currentUser?.role !== "client")
    throw new CustomError(
      "Carts are not allowed for this user",
      StatusCodes.FORBIDDEN
    );

  const { productId, quantity } = req.body;

  let draftCart = await DraftCart.findOne({ user: userId });

  if (!draftCart) draftCart = await DraftCart.create({ user: userId });

  const productIndex = draftCart.products.findIndex(
    (product) => product.productId.toString() === productId
  );

  if (productIndex === -1) {
    res.status(StatusCodes.OK).json(draftCart);
  } else {
    const product = draftCart.products[productIndex];

    if (product.quantity > quantity) {
      product.quantity -= quantity;
      const diffPrice = product.itemPrice * quantity;
      product.totalPrice -= diffPrice;
    } else {
      draftCart.products.splice(productIndex, 1);
    }

    await draftCart.save();

    res.status(StatusCodes.OK).json(draftCart);
  }
};

export const getAllDraftCarts = async (req: Request, res: Response) => {
  const { skip, limit } = getPagination(req.query);

  const data = await DraftCart.aggregate(
    getPaginationPipline({
      beforePipline: [
        { $match: { "products.0": { $exists: true } } },
        ...getAggregatedLookup([
          { collection: "users", fieldName: "user", isArray: false },
        ]),
        { $sort: { createdAt: -1 } },
      ],
      skip,
      limit,
      dataPipline: [
        {
          $project: {
            user: {
              _id: 1,
              fullName: 1,
              email: 1,
            },
            products: 1,
          },
        },
      ],
    })
  );

  res.status(StatusCodes.OK).json(data[0] || emptyPaginationList(skip, limit));
};

export const getDraftCartForStaff = async (req: Request, res: Response) => {
  const { userId } = req.params;

  const user = await User.findById(userId);

  if (!user) {
    throw new CustomError("User not found", StatusCodes.NOT_FOUND);
  }

  if (user.role !== "client")
    throw new CustomError(
      "Carts are not allowed for this user",
      StatusCodes.FORBIDDEN
    );

  let draftCart = await DraftCart.findOne({ user: userId });

  if (!draftCart) {
    draftCart = await DraftCart.create({ user: userId });
  }

  res.status(StatusCodes.OK).json(draftCart);
};

export const addProductToDraftCartForStaff = async (
  req: Request,
  res: Response
) => {
  const { productId, quantity, userId } = req.body;

  const user = await User.findById(userId);

  if (!user) {
    throw new CustomError("User not found", StatusCodes.NOT_FOUND);
  }

  if (user.role !== "client")
    throw new CustomError(
      "Carts are not allowed for this user",
      StatusCodes.FORBIDDEN
    );

  const product = await Product.findById(productId);

  if (!product) {
    throw new CustomError("Product not found", StatusCodes.NOT_FOUND);
  }

  let draftCart = await DraftCart.findOne({ user: userId });

  if (!draftCart) draftCart = await DraftCart.create({ user: userId });

  const productIndex = draftCart.products.findIndex(
    (product) => product.productId.toString() === productId
  );

  const totalPrice = product.finalPrice * quantity;
  if (productIndex === -1) {
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
    draftCart.products[productIndex].quantity += quantity;
    draftCart.products[productIndex].totalPrice += totalPrice;
  }

  draftCart.save();

  res.status(StatusCodes.OK).json(draftCart);
};

export const removeProductFromDraftCartForStaff = async (
  req: Request,
  res: Response
) => {
  const { productId, quantity, userId } = req.body;

  const user = await User.findById(userId);

  if (!user) {
    throw new CustomError("User not found", StatusCodes.NOT_FOUND);
  }

  if (user.role !== "client")
    throw new CustomError(
      "Carts are not allowed for this user",
      StatusCodes.FORBIDDEN
    );

  let draftCart = await DraftCart.findOne({ user: userId });

  if (!draftCart) draftCart = await DraftCart.create({ user: userId });

  const productIndex = draftCart.products.findIndex(
    (product) => product.productId.toString() === productId
  );

  if (productIndex === -1) {
    res.status(StatusCodes.OK).json(draftCart);
  } else {
    const product = draftCart.products[productIndex];

    if (product.quantity > quantity) {
      product.quantity -= quantity;
      const diffPrice = product.itemPrice * quantity;
      product.totalPrice -= diffPrice;
    } else {
      draftCart.products.splice(productIndex, 1);
    }

    await draftCart.save();

    res.status(StatusCodes.OK).json(draftCart);
  }
};
