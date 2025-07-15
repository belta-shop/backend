import { Request, Response } from "express";
import { getPagination } from "../../utils/routes";
import ActiveCart from "../../models/carts/active-cart.model";
import {
  emptyPaginationList,
  getAggregatedLookup,
  getPaginationPipline,
} from "../../utils/models";
import { StatusCodes } from "http-status-codes";
import CustomError from "../../errors/custom-error";
import User from "../../models/user.model";
import { activeCartService } from "../../services";
import { Language } from "../../types/language";

const translateCartProducts = (cart: any, lang: Language): any => {
  const cartObject = cart.toObject();

  return {
    ...cartObject,
    products: cartObject.products.map(
      ({ _id, nameAr, nameEn, ...item }: any) => ({
        _id,
        name: lang === "ar" ? nameAr : nameEn,
        ...item,
      })
    ),
  };
};

export const getActiveCart = async (req: Request, res: Response) => {
  const cart = await activeCartService.getCart({
    userId: req.currentUser!.sub,
    role: req.currentUser!.role,
  });

  res.status(StatusCodes.OK).json(translateCartProducts(cart, req.lang));
};

export const addProductToActiveCart = async (req: Request, res: Response) => {
  const { productId, quantity } = req.body;

  let updatedCart = await activeCartService.addProduct({
    userId: req.currentUser!.sub,
    role: req.currentUser!.role,
    productId,
    quantity,
  });

  res.status(StatusCodes.OK).json(translateCartProducts(updatedCart, req.lang));
};

export const removeProductFromActiveCart = async (
  req: Request,
  res: Response
) => {
  const { productId, quantity } = req.body;

  const updatedCart = await activeCartService.removeProduct({
    userId: req.currentUser!.sub,
    role: req.currentUser!.role,
    productId,
    quantity,
  });

  res.status(StatusCodes.OK).json(translateCartProducts(updatedCart, req.lang));
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

  const cart = await activeCartService.getCart({
    userId,
  });

  res.status(StatusCodes.OK).json(cart);
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

  const updatedCart = await activeCartService.addProduct({
    userId,
    productId,
    quantity,
    role: user.role,
  });

  res.status(StatusCodes.OK).json(updatedCart);
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

  const updatedCart = await activeCartService.removeProduct({
    userId,
    productId,
    quantity,
    role: user.role,
  });

  res.status(StatusCodes.OK).json(updatedCart);
};
