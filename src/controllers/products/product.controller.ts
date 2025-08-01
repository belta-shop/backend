import { Request, Response } from "express";
import Product from "../../models/products/product.model";
import { StatusCodes } from "http-status-codes";
import {
  getPagination,
  onlyAdminCanModify,
  onlyAdminCanSetReadOnly,
} from "../../utils/routes";
import SubCategory from "../../models/products/sub-category.model";
import Brand from "../../models/products/brand.model";
import { IOffer } from "../../types/products";
import CustomError from "../../errors/custom-error";
import {
  emptyPaginationList,
  getAggregatedLookup,
  getPaginationPipline,
} from "../../utils/models";
import Offer from "../../models/products/offer.model";
import { DraftCartProductReason } from "../../types/cart";
import { activeCartService } from "../../services";
import { ObjectId } from "mongoose";

// Public get all products
export const getAllProducts = async (req: Request, res: Response) => {
  const { search, brand, subcategory, label, tag } = req.query;
  const { skip, limit } = getPagination(req.query);

  let query: any = {
    disabled: false,
  };

  // handle Search for name and tags using same search query
  if (typeof search === "string" && search) {
    query.$or = [
      { nameAr: { $regex: search, $options: "i" } },
      { nameEn: { $regex: search, $options: "i" } },
      { "brand.nameAr": { $regex: search, $options: "i" } },
      { "brand.nameEn": { $regex: search, $options: "i" } },
      { "subcategory.nameAr": { $regex: search, $options: "i" } },
      { "subcategory.nameEn": { $regex: search, $options: "i" } },
      {
        tags: {
          $elemMatch: {
            $or: [
              { nameAr: { $regex: search, $options: "i" } },
              { nameEn: { $regex: search, $options: "i" } },
            ],
          },
        },
      },
    ];
  }

  if (brand) query.brand = brand;
  if (subcategory) query.subcategory = subcategory;
  if (label) query.labels = label;
  if (tag) query.tags = tag;

  const lookup = getAggregatedLookup([
    { collection: "brands", fieldName: "brand", isArray: false },
    { collection: "offers", fieldName: "offer", isArray: false },
    { collection: "subcategories", fieldName: "subcategory", isArray: false },
    { collection: "tags", fieldName: "tags", isArray: true },
    { collection: "labels", fieldName: "labels", isArray: true },
  ]);

  const data = await Product.aggregate(
    getPaginationPipline({
      beforePipline: [
        ...lookup,
        { $match: query },
        { $sort: { createdAt: -1 } },
      ],
      skip,
      limit,
      dataPipline: [
        {
          $project: {
            name: req.lang === "ar" ? "$nameAr" : "$nameEn",
            description:
              req.lang === "ar" ? "$descriptionAr" : "$descriptionEn",
            coverList: 1,
            rating: 1,
            reviews: 1,
            offer: 1,
            brand: {
              _id: 1,
              name: req.lang === "ar" ? "$brand.nameAr" : "$brand.nameEn",
            },
            subcategory: {
              _id: 1,
              name:
                req.lang === "ar"
                  ? "$subcategory.nameAr"
                  : "$subcategory.nameEn",
            },
            labels: {
              $map: {
                input: "$labels",
                as: "label",
                in: {
                  _id: "$$label._id",
                  name: req.lang === "ar" ? "$$label.nameAr" : "$$label.nameEn",
                  color: "$$label.color",
                },
              },
            },
            tags: {
              $map: {
                input: "$tags",
                as: "tag",
                in: {
                  _id: "$$tag._id",
                  name: req.lang === "ar" ? "$$tag.nameAr" : "$$tag.nameEn",
                },
              },
            },
            quantity: 1,
            disabled: 1,
            price: 1,
            finalPrice: 1,
          },
        },
      ],
    })
  );

  res.status(StatusCodes.OK).json(data[0] || emptyPaginationList(skip, limit));
};

// Staff get all products
export const getAllProductsForStaff = async (req: Request, res: Response) => {
  const {
    search,
    disabled,
    brand,
    subcategory,
    label,
    tag,
    employeeReadOnly,
    offer,
  } = req.query;
  const { skip, limit } = getPagination(req.query);

  let query: any = {};

  if (search)
    query.$or = [
      { nameAr: { $regex: search, $options: "i" } },
      { nameEn: { $regex: search, $options: "i" } },
    ];

  const andQuery: any = [];

  if (disabled !== undefined)
    andQuery.push({ $eq: ["$disabled", disabled === "true"] });
  if (tag) {
    andQuery.push({
      $in: [{ $toObjectId: tag }, "$tags"],
    });
  }

  if (brand) andQuery.push({ $eq: ["$brand", { $toObjectId: brand }] });
  if (subcategory)
    andQuery.push({ $eq: ["$subcategory", { $toObjectId: subcategory }] });
  if (label) andQuery.push({ $eq: ["$labels", label] });
  if (employeeReadOnly !== undefined)
    andQuery.push({ $eq: ["$employeeReadOnly", employeeReadOnly === "true"] });
  if (offer) andQuery.push({ $eq: ["$offer", { $toObjectId: offer }] });

  if (andQuery.length > 0) query.$expr = { $and: andQuery };

  const lookup = getAggregatedLookup([
    { collection: "brands", fieldName: "brand", isArray: false },
    { collection: "offers", fieldName: "offer", isArray: false },
    { collection: "subcategories", fieldName: "subcategory", isArray: false },
    { collection: "tags", fieldName: "tags", isArray: true },
  ]);

  const data = await Product.aggregate(
    getPaginationPipline({
      beforePipline: [
        {
          $match: query,
        },
        { $sort: { createdAt: -1 } },
        ...lookup,
      ],
      skip,
      limit,
      dataPipline: [
        {
          $project: {
            nameAr: 1,
            nameEn: 1,
            descriptionAr: 1,
            descriptionEn: 1,
            coverList: 1,
            rating: 1,
            reviews: 1,
            offer: 1,
            brand: 1,
            subcategory: 1,
            labels: 1,
            tags: 1,
            quantity: 1,
            disabled: 1,
            price: 1,
            minPrice: 1,
            finalPrice: 1,
            employeeReadOnly: 1,
          },
        },
      ],
    })
  );

  res.status(StatusCodes.OK).json(data[0] || emptyPaginationList(skip, limit));
};

// Public get single product
export const getProduct = async (req: Request, res: Response) => {
  const product = await Product.findById(req.params.id)
    .select({
      name: req.lang === "ar" ? "$nameAr" : "$nameEn",
      description: req.lang === "ar" ? "$descriptionAr" : "$descriptionEn",
      coverList: 1,
      rating: 1,
      reviews: 1,
      offer: 1,
      brand: 1,
      subcategory: 1,
      labels: 1,
      tags: 1,
      quantity: 1,
      disabled: 1,
      price: 1,
      finalPrice: 1,
    })
    .select("-createdAt -updatedAt")
    .populate([
      {
        path: "brand",
        select: {
          name: req.lang === "ar" ? "$nameAr" : "$nameEn",
          cover: 1,
        },
      },
      {
        path: "subcategory",
        select: {
          name: req.lang === "ar" ? "$nameAr" : "$nameEn",
          cover: 1,
        },
      },
      {
        path: "labels",
        select: {
          name: req.lang === "ar" ? "$nameAr" : "$nameEn",
          color: 1,
        },
      },
      {
        path: "tags",
        select: {
          name: req.lang === "ar" ? "$nameAr" : "$nameEn",
        },
      },
      {
        path: "offer",
        select: {
          name: req.lang === "ar" ? "$nameAr" : "$nameEn",
        },
      },
    ]);

  if (!product)
    throw new CustomError("Product not found", StatusCodes.NOT_FOUND);

  res.status(StatusCodes.OK).json(product);
};

// Staff get single product
export const getProductForStaff = async (req: Request, res: Response) => {
  const product = await Product.findById(req.params.id)
    .populate("brand")
    .populate("subcategory")
    .populate("labels")
    .populate("tags")
    .populate("offer");

  if (!product)
    throw new CustomError("Product not found", StatusCodes.NOT_FOUND);

  res.status(StatusCodes.OK).json(product);
};

// Create product (staff only)
export const createProduct = async (req: Request, res: Response) => {
  onlyAdminCanSetReadOnly(req);

  const product = await Product.create(req.body);
  await product.populate([
    { path: "brand" },
    { path: "subcategory" },
    { path: "labels" },
    { path: "tags" },
    { path: "offer" },
  ]);
  res.status(StatusCodes.CREATED).json(product);
};

// Update product (staff only)
export const updateProduct = async (req: Request, res: Response) => {
  const product = await Product.findById(req.params.id);
  if (!product)
    throw new CustomError("Product not found", StatusCodes.NOT_FOUND);

  onlyAdminCanModify(req, product);
  onlyAdminCanSetReadOnly(req);

  const oldFinalPrice = product.finalPrice;

  Object.assign(product, req.body);
  await product.save();
  await product.populate([
    { path: "brand" },
    { path: "subcategory" },
    { path: "labels" },
    { path: "tags" },
    { path: "offer" },
  ]);

  const newFinalPrice =
    (await (
      product.offer as unknown as IOffer | null
    )?.calculateFinalPrice()) || product.price;

  product.finalPrice = newFinalPrice; // saved already in method but didn't updated here

  res.status(StatusCodes.OK).json(product);

  // Update products in active carts
  if (newFinalPrice !== oldFinalPrice) {
    await activeCartService.moveProductToDraft({
      productId: product._id as ObjectId,
      reason: DraftCartProductReason.PriceChange,
    });
  }
};

// Delete product (staff only)
export const deleteProduct = async (req: Request, res: Response) => {
  const product = await Product.findById(req.params.id);
  if (!product)
    throw new CustomError("Product not found", StatusCodes.NOT_FOUND);

  onlyAdminCanModify(req, product);

  if (product.offer) {
    await Offer.findByIdAndDelete(product.offer);
  }
  await product.deleteOne();
  res.status(StatusCodes.OK).json({ message: "Product deleted successfully" });
};

// Link product to subcategory (staff only)
export const linkProductToSubCategory = async (req: Request, res: Response) => {
  const { productId, subcategoryId } = req.body;

  const product = await Product.findById(productId);
  if (!product)
    throw new CustomError("Product not found", StatusCodes.NOT_FOUND);

  onlyAdminCanModify(req, product);

  if (product.subcategory)
    throw new CustomError(
      "Product is already linked to a subcategory",
      StatusCodes.BAD_REQUEST
    );

  const subcategory = await SubCategory.findById(subcategoryId);
  if (!subcategory)
    throw new CustomError("Subcategory not found", StatusCodes.NOT_FOUND);

  // Update product
  product.subcategory = subcategoryId;
  await product.save();

  // Update subcategory
  subcategory.products.push(productId);
  await subcategory.save();

  // Populate and return product
  await product.populate([
    { path: "brand" },
    { path: "subcategory" },
    { path: "labels" },
    { path: "tags" },
    { path: "offer" },
  ]);

  res.status(StatusCodes.OK).json(product);
};

// Unlink product from subcategory (staff only)
export const unlinkProductFromSubCategory = async (
  req: Request,
  res: Response
) => {
  const { productId } = req.body;

  const product = await Product.findById(productId).populate("subcategory");
  if (!product)
    throw new CustomError("Product not found", StatusCodes.NOT_FOUND);

  onlyAdminCanModify(req, product);
  if (!product.subcategory)
    throw new CustomError(
      "Product is not linked to any subcategory",
      StatusCodes.BAD_REQUEST
    );

  // Get subcategory before unlinking
  const subcategory = await SubCategory.findById(product.subcategory);
  if (!subcategory)
    throw new CustomError("Subcategory not found", StatusCodes.NOT_FOUND);

  // Update product
  product.subcategory = undefined;
  await product.save();

  // Update subcategory
  subcategory.products = subcategory.products.filter(
    (id) => id.toString() !== productId
  );
  await subcategory.save();

  // Populate and return product
  await product.populate([
    { path: "brand" },
    { path: "labels" },
    { path: "tags" },
    { path: "offer" },
  ]);

  res.status(StatusCodes.OK).json(product);
};

// Add these new functions for brand linking
export const linkProductToBrand = async (req: Request, res: Response) => {
  const { productId, brandId } = req.body;

  const product = await Product.findById(productId);
  if (!product)
    throw new CustomError("Product not found", StatusCodes.NOT_FOUND);

  const brand = await Brand.findById(brandId);
  if (!brand) throw new CustomError("Brand not found", StatusCodes.NOT_FOUND);

  if (product.brand)
    throw new CustomError(
      "Product is already linked to a brand",
      StatusCodes.BAD_REQUEST
    );

  onlyAdminCanModify(req, product);

  product.brand = brandId;
  await product.save();
  brand.products.push(productId);
  await brand.save();

  await product.populate([
    { path: "brand" },
    { path: "subcategory" },
    { path: "labels" },
    { path: "tags" },
    { path: "offer" },
  ]);

  res.status(StatusCodes.OK).json(product);
};

export const unlinkProductFromBrand = async (req: Request, res: Response) => {
  const { productId } = req.body;

  const product = await Product.findById(productId);
  if (!product)
    throw new CustomError("Product not found", StatusCodes.NOT_FOUND);

  const brand = await Brand.findById(product.brand);
  if (!brand) throw new CustomError("Brand not found", StatusCodes.NOT_FOUND);

  if (!product.brand)
    throw new CustomError(
      "Product is not linked to this brand",
      StatusCodes.BAD_REQUEST
    );

  onlyAdminCanModify(req, product);

  product.brand = undefined;
  await product.save();
  brand.products = brand.products.filter((id) => id.toString() !== productId);
  await brand.save();

  await product.populate([
    { path: "subcategory" },
    { path: "labels" },
    { path: "tags" },
    { path: "offer" },
  ]);

  res.status(StatusCodes.OK).json(product);
};
