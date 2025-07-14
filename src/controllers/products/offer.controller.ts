import { Request, Response } from "express";
import Offer from "../../models/products/offer.model";
import Product from "../../models/products/product.model";
import { StatusCodes } from "http-status-codes";
import {
  getPagination,
  getSearchQuery,
  onlyAdminCanModify,
  onlyAdminCanSetReadOnly,
} from "../../utils/routes";
import CustomError from "../../errors/custom-error";
import {
  emptyPaginationList,
  getAggregatedLookup,
  getPaginationPipline,
} from "../../utils/models";
import { activeCartService } from "../../services";
import { DraftCartProductReason } from "../../types/cart";
import { ObjectId } from "mongoose";

// Get all offers (staff only)
export const getAllOffers = async (req: Request, res: Response) => {
  const { search, disabled, type, productId, employeeReadOnly } = req.query;
  const { skip, limit } = getPagination(req.query);

  let query: any = {
    ...getSearchQuery(search, ["nameAr", "nameEn"]),
  };

  if (disabled !== undefined) query.disabled = disabled === "true";
  if (type) query.type = type;
  if (productId) query.product = productId;
  if (employeeReadOnly !== undefined)
    query.employeeReadOnly = employeeReadOnly === "true";

  const data = await Offer.aggregate(
    getPaginationPipline({
      beforePipline: [{ $match: query }, { $sort: { createdAt: -1 } }],
      skip,
      limit,
      dataPipline: [
        {
          $project: {
            nameAr: 1,
            nameEn: 1,
            color: 1,
            product: {
              _id: 1,
              nameAr: 1,
              nameEn: 1,
              coverList: 1,
              price: 1,
              finalPrice: 1,
            },
            employeeReadOnly: 1,
            offerQuantity: 1,
            maxPerClient: 1,
            quantityPurchased: 1,
            disabled: 1,
            type: 1,
            value: 1,
          },
        },
      ],
    })
  );

  res.status(StatusCodes.OK).json(data[0] || emptyPaginationList(skip, limit));
};

// Get single offer (staff only)
export const getOffer = async (req: Request, res: Response) => {
  const offer = await Offer.findById(req.params.id).populate("product");

  if (!offer) {
    throw new CustomError("Offer not found", StatusCodes.NOT_FOUND);
  }

  res.status(StatusCodes.OK).json(offer);
};

// Create offer (staff only)
export const createOffer = async (req: Request, res: Response) => {
  const { productId } = req.body;

  onlyAdminCanSetReadOnly(req);

  // Check if product exists
  const product = await Product.findById(productId);
  if (!product)
    throw new CustomError("Product not found", StatusCodes.NOT_FOUND);

  // Check if product already has an offer
  if (product.offer)
    throw new CustomError(
      "Product already has an offer",
      StatusCodes.BAD_REQUEST
    );

  // Create the offer
  const offer = await Offer.create({
    ...req.body,
    product: productId,
  });

  await offer.calculateFinalPrice();

  // Link offer to product and trigger final price recalculation
  product.offer = offer._id as any;
  await product.save();

  await offer.populate("product", "nameAr nameEn price finalPrice");
  res.status(StatusCodes.CREATED).json(offer);
};

// Update offer (staff only)
export const updateOffer = async (req: Request, res: Response) => {
  const offer = await Offer.findById(req.params.id);
  if (!offer) {
    throw new CustomError("Offer not found", StatusCodes.NOT_FOUND);
  }

  onlyAdminCanModify(req, offer);
  onlyAdminCanSetReadOnly(req);

  const productsToRemoveFromCarts = new Set<ObjectId>();

  const isProductChanged =
    req.body.product && req.body.product !== offer.product.toString();
  if (isProductChanged) {
    const newProduct = await Product.findById(req.body.product);
    if (!newProduct)
      throw new CustomError("New product not found", StatusCodes.NOT_FOUND);

    if (newProduct.offer)
      throw new CustomError(
        "New product already has an offer",
        StatusCodes.CONFLICT
      );

    const oldProduct = await Product.findById(offer.product);
    if (oldProduct) {
      oldProduct.finalPrice = oldProduct.price;
      oldProduct.offer = null as unknown as undefined;
      await oldProduct.save();

      productsToRemoveFromCarts.add(oldProduct._id as ObjectId);
    }

    // Link offer to new product
    newProduct.offer = offer._id as any;
    await newProduct.save();

    offer.product = newProduct._id as any;
    await offer.save();
  }

  Object.assign(offer, req.body);
  await offer.save();

  await offer.calculateFinalPrice();

  if (offer.product)
    productsToRemoveFromCarts.add(offer.product as unknown as ObjectId);

  await offer.populate("product", "nameAr nameEn price finalPrice");
  res.status(StatusCodes.OK).json(offer);

  // Update products in active carts
  for (const productId of productsToRemoveFromCarts) {
    await activeCartService.moveProductToDraft({
      productId,
      reason: DraftCartProductReason.PriceChange,
    });
  }
};

export const deleteOffer = async (req: Request, res: Response) => {
  const offer = await Offer.findById(req.params.id);
  if (!offer) throw new CustomError("Offer not found", StatusCodes.NOT_FOUND);

  onlyAdminCanModify(req, offer);

  const product = await Product.findByIdAndUpdate(
    offer.product,
    {
      $unset: { offer: 1 },
    },
    { new: true }
  );

  if (product) {
    product.finalPrice = product.price;
    product.offer = undefined;
    await product.save();
  }

  await offer.deleteOne();
  res.status(StatusCodes.OK).json({ message: "Offer deleted successfully" });
};
