import { Request, Response } from "express";
import { getPagination } from "../../utils/routes";
import ActiveCart from "../../models/carts/active-cart.model";
import {
  emptyPaginationList,
  getAggregatedLookup,
  getPaginationPipline,
} from "../../utils/models";
import { StatusCodes } from "http-status-codes";
import Product from "../../models/products/product.model";
import CustomError from "../../errors/custom-error";
import User from "../../models/user.model";

export const getActiveCart = async (req: Request, res: Response) => {
  const userId = req.currentUser?.sub;

  if (req.currentUser?.role !== "client")
    throw new CustomError(
      "Carts are not allowed for this user",
      StatusCodes.FORBIDDEN
    );

  let activeCart = await ActiveCart.findOne({ user: userId });

  if (!activeCart) {
    activeCart = await ActiveCart.create({ user: userId });
  }

  res.status(StatusCodes.OK).json(activeCart);
};

export const addProductToActiveCart = async (req: Request, res: Response) => {
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

  let activeCart = await ActiveCart.findOne({ user: userId });

  if (!activeCart) activeCart = await ActiveCart.create({ user: userId });

  const productIndex = activeCart.products.findIndex(
    (product) => product.productId.toString() === productId
  );

  const totalPrice = product.finalPrice * quantity;
  if (productIndex === -1) {
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
    activeCart.products[productIndex].quantity += quantity;
    activeCart.products[productIndex].totalPrice += totalPrice;
    activeCart.finalPrice += totalPrice;
  }

  activeCart.save();

  res.status(StatusCodes.OK).json(activeCart);
};

export const removeProductFromActiveCart = async (
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

  let activeCart = await ActiveCart.findOne({ user: userId });

  if (!activeCart) activeCart = await ActiveCart.create({ user: userId });

  const productIndex = activeCart.products.findIndex(
    (product) => product.productId.toString() === productId
  );

  if (productIndex === -1) {
    res.status(StatusCodes.OK).json(activeCart);
  } else {
    const product = activeCart.products[productIndex];

    if (product.quantity > quantity) {
      product.quantity -= quantity;
      const diffPrice = product.itemPrice * quantity;
      product.totalPrice -= diffPrice;
      activeCart.finalPrice -= diffPrice;
    } else {
      activeCart.finalPrice -= product.totalPrice;
      activeCart.products.splice(productIndex, 1);
    }

    await activeCart.save();

    res.status(StatusCodes.OK).json(activeCart);
  }
};

export const getAllActiveCarts = async (req: Request, res: Response) => {
  const { skip, limit } = getPagination(req.query);

  const data = await ActiveCart.aggregate(
    getPaginationPipline({
      beforePipline: [
        { $match: { totalPrice: { $gt: 0 } } },
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
            finalPrice: 1,
            products: 1,
          },
        },
      ],
    })
  );

  res.status(StatusCodes.OK).json(data[0] || emptyPaginationList(skip, limit));
};

export const getActiveCartForStaff = async (req: Request, res: Response) => {
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

  let activeCart = await ActiveCart.findOne({ user: userId });

  if (!activeCart) {
    activeCart = await ActiveCart.create({ user: userId });
  }

  res.status(StatusCodes.OK).json(activeCart);
};

export const addProductToActiveCartForStaff = async (
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

  let activeCart = await ActiveCart.findOne({ user: userId });

  if (!activeCart) activeCart = await ActiveCart.create({ user: userId });

  const productIndex = activeCart.products.findIndex(
    (product) => product.productId.toString() === productId
  );

  const totalPrice = product.finalPrice * quantity;
  if (productIndex === -1) {
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
    activeCart.products[productIndex].quantity += quantity;
    activeCart.products[productIndex].totalPrice += totalPrice;
    activeCart.finalPrice += totalPrice;
  }

  activeCart.save();

  res.status(StatusCodes.OK).json(activeCart);
};

export const removeProductFromActiveCartForStaff = async (
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

  let activeCart = await ActiveCart.findOne({ user: userId });

  if (!activeCart) activeCart = await ActiveCart.create({ user: userId });

  const productIndex = activeCart.products.findIndex(
    (product) => product.productId.toString() === productId
  );

  if (productIndex === -1) {
    res.status(StatusCodes.OK).json(activeCart);
  } else {
    const product = activeCart.products[productIndex];

    if (product.quantity > quantity) {
      product.quantity -= quantity;
      const diffPrice = product.itemPrice * quantity;
      product.totalPrice -= diffPrice;
      activeCart.finalPrice -= diffPrice;
    } else {
      activeCart.finalPrice -= product.totalPrice;
      activeCart.products.splice(productIndex, 1);
    }

    await activeCart.save();

    res.status(StatusCodes.OK).json(activeCart);
  }
};
