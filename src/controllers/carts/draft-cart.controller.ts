import { Request, Response } from "express";
import { getPagination } from "../../utils/routes";
import DraftCart from "../../models/carts/draft-cart.model";
import {
  emptyPaginationList,
  getAggregatedLookup,
  getPaginationPipline,
} from "../../utils/models";
import { StatusCodes } from "http-status-codes";
import { draftCartService } from "../../services";
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

export const getDraftCart = async (req: Request, res: Response) => {
  const cart = await draftCartService.getCart({
    userId: req.currentUser!.sub,
    role: req.currentUser!.role,
  });

  res.status(StatusCodes.OK).json(translateCartProducts(cart, req.lang));
};

export const addProductToDraftCart = async (req: Request, res: Response) => {
  const { productId, quantity } = req.body;

  const updatedCart = await draftCartService.addProduct({
    userId: req.currentUser!.sub,
    role: req.currentUser!.role,
    productId,
    quantity,
  });

  res.status(StatusCodes.OK).json(translateCartProducts(updatedCart, req.lang));
};

export const removeProductFromDraftCart = async (
  req: Request,
  res: Response
) => {
  const { productId, quantity } = req.body;

  const updatedCart = await draftCartService.removeProduct({
    userId: req.currentUser!.sub,
    role: req.currentUser!.role,
    productId,
    quantity,
  });

  res.status(StatusCodes.OK).json(translateCartProducts(updatedCart, req.lang));
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

  const cart = await draftCartService.getCart({ userId });

  res.status(StatusCodes.OK).json(cart);
};

export const addProductToDraftCartForStaff = async (
  req: Request,
  res: Response
) => {
  const { productId, quantity, userId } = req.body;

  const updatedCart = await draftCartService.addProduct({
    userId,
    productId,
    quantity,
  });

  res.status(StatusCodes.OK).json(updatedCart);
};

export const removeProductFromDraftCartForStaff = async (
  req: Request,
  res: Response
) => {
  const { productId, quantity, userId } = req.body;

  const updatedCart = await draftCartService.removeProduct({
    userId,
    productId,
    quantity,
  });

  res.status(StatusCodes.OK).json(updatedCart);
};
