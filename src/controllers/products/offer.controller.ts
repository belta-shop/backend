import { Request, Response } from "express";
import Offer from "../../models/products/offer.model";
import Product from "../../models/products/product.model";
import ErrorAPI from "../../errors/error-api";
import { StatusCodes } from "http-status-codes";
import {
  getPagination,
  getSearchQuery,
  onlyAdminCanModify,
  onlyAdminCanSetReadOnly,
} from "../../utils/routes";

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

  const offers = await Offer.find(query)
    .populate("product", "nameAr nameEn price finalPrice")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await Offer.countDocuments(query);

  res.status(StatusCodes.OK).json({ items: offers, total });
};

// Get single offer (staff only)
export const getOffer = async (req: Request, res: Response) => {
  const offer = await Offer.findById(req.params.id).populate(
    "product",
    "nameAr nameEn price finalPrice"
  );

  if (!offer) {
    throw new ErrorAPI("Offer not found", StatusCodes.NOT_FOUND);
  }

  res.status(StatusCodes.OK).json(offer);
};

// Create offer (staff only)
export const createOffer = async (req: Request, res: Response) => {
  const { productId } = req.body;

  onlyAdminCanSetReadOnly(req);

  // Check if product exists
  const product = await Product.findById(productId);
  if (!product) throw new ErrorAPI("Product not found", StatusCodes.NOT_FOUND);

  // Check if product already has an offer
  if (product.offer)
    throw new ErrorAPI("Product already has an offer", StatusCodes.BAD_REQUEST);

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
    throw new ErrorAPI("Offer not found", StatusCodes.NOT_FOUND);
  }

  onlyAdminCanModify(req, offer);
  onlyAdminCanSetReadOnly(req);

  const isProductChanged =
    req.body.productId && req.body.productId !== offer.product.toString();
  if (isProductChanged) {
    const newProduct = await Product.findById(req.body.productId);
    if (!newProduct)
      throw new ErrorAPI("New product not found", StatusCodes.NOT_FOUND);

    if (newProduct.offer)
      throw new ErrorAPI(
        "New product already has an offer",
        StatusCodes.CONFLICT
      );

    const oldProduct = await Product.findByIdAndUpdate(
      offer.product,
      {
        $unset: { offer: 1 },
      },
      { new: true }
    );
    if (oldProduct) {
      oldProduct.finalPrice = oldProduct.price;
      await oldProduct.save();
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

  await offer.populate("product", "nameAr nameEn price finalPrice");
  res.status(StatusCodes.OK).json(offer);
};

export const deleteOffer = async (req: Request, res: Response) => {
  const offer = await Offer.findById(req.params.id);
  if (!offer) throw new ErrorAPI("Offer not found", StatusCodes.NOT_FOUND);

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
    await product.save();
  }

  await offer.deleteOne();
  res.status(StatusCodes.OK).json({ message: "Offer deleted successfully" });
};
