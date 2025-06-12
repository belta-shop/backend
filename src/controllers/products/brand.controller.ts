import { Request, Response } from "express";
import Brand from "../../models/products/brand.model";
import Product from "../../models/products/product.model";
import ErrorAPI from "../../errors/error-api";
import { StatusCodes } from "http-status-codes";
import {
  getPagination,
  getSearchQuery,
  onlyAdminCanModify,
  onlyAdminCanSetReadOnly,
} from "../../utils/routes";

// Staff get all brands
export const getAllBrandsForStaff = async (req: Request, res: Response) => {
  const { search, disabled } = req.query;
  const { skip, limit } = getPagination(req.query);

  let query: any = {
    ...getSearchQuery(search, ["nameAr", "nameEn"]),
  };

  if (disabled !== undefined) query.disabled = disabled === "true";

  const brands = await Brand.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate("products");

  const total = await Brand.countDocuments(query);

  res.status(StatusCodes.OK).json({ items: brands, total });
};

// Client get all brands
export const getAllBrands = async (req: Request, res: Response) => {
  const { search } = req.query;
  const { skip, limit } = getPagination(req.query);

  let query: any = {
    disabled: false,
    ...getSearchQuery(search, ["nameAr", "nameEn"]),
  };

  const brands = await Brand.find(query)
    .select({
      name: req.lang === "ar" ? "$nameAr" : "$nameEn",
      cover: 1,
    })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await Brand.countDocuments(query);

  res.status(StatusCodes.OK).json({ items: brands, total });
};

// Staff get single brand
export const getBrandForStaff = async (req: Request, res: Response) => {
  const brand = await Brand.findById(req.params.id).populate("products");

  if (!brand) throw new ErrorAPI("Brand not found", StatusCodes.NOT_FOUND);

  res.status(StatusCodes.OK).json(brand);
};

// Client get single brand
export const getBrand = async (req: Request, res: Response) => {
  const brand = await Brand.findById(req.params.id).select({
    name: req.lang === "ar" ? "$nameAr" : "$nameEn",
    cover: 1,
  });

  if (!brand) throw new ErrorAPI("Brand not found", StatusCodes.NOT_FOUND);

  res.status(StatusCodes.OK).json(brand);
};

// Create brand (staff only)
export const createBrand = async (req: Request, res: Response) => {
  onlyAdminCanSetReadOnly(req);

  const brand = await Brand.create(req.body);
  res.status(StatusCodes.CREATED).json(brand);
};

// Update brand (staff only)
export const updateBrand = async (req: Request, res: Response) => {
  const brand = await Brand.findById(req.params.id);
  if (!brand) throw new ErrorAPI("Brand not found", StatusCodes.NOT_FOUND);

  Object.assign(brand, req.body);
  await brand.save();

  res.status(StatusCodes.OK).json(brand);
};

// Delete brand (staff only)
export const deleteBrand = async (req: Request, res: Response) => {
  const brand = await Brand.findById(req.params.id);
  if (!brand) throw new ErrorAPI("Brand not found", StatusCodes.NOT_FOUND);

  await brand.deleteOne();
  res.status(StatusCodes.OK).json({ message: "Brand deleted successfully" });
};
