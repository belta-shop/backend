import { Request, Response } from "express";
import Category from "../../models/products/category.model";
import { StatusCodes } from "http-status-codes";
import {
  getPagination,
  getSearchQuery,
  onlyAdminCanModify,
  onlyAdminCanSetReadOnly,
} from "../../utils/routes";
import CustomError from "../../errors/custom-error";

// Public get all categories
export const getAllCategories = async (req: Request, res: Response) => {
  const { search } = req.query;
  const { skip, limit } = getPagination(req.query);

  let query: any = {
    disabled: false,
    ...getSearchQuery(search, ["nameAr", "nameEn"]),
  };

  const categories = await Category.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .select({
      name: req.lang === "ar" ? "$nameAr" : "$nameEn",
      cover: 1,
    })
    .select("-createdAt -updatedAt")
    .lean();

  const total = await Category.countDocuments(query);

  res.status(StatusCodes.OK).json({ items: categories, total });
};

// Staff get all categories
export const getAllCategoriesForStaff = async (req: Request, res: Response) => {
  const { search, disabled, employeeReadOnly } = req.query;
  const { skip, limit } = getPagination(req.query);

  let query: any = { ...getSearchQuery(search, ["nameAr", "nameEn"]) };

  if (disabled !== undefined) query.disabled = disabled === "true";
  if (employeeReadOnly !== undefined)
    query.employeeReadOnly = employeeReadOnly === "true";

  const categories = await Category.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await Category.countDocuments(query);

  res.status(StatusCodes.OK).json({ items: categories, total });
};

// Public get single category
export const getCategory = async (req: Request, res: Response) => {
  const category = await Category.findById(req.params.id)
    .select({
      name: req.lang === "ar" ? "$nameAr" : "$nameEn",
      cover: 1,
    })
    .select("-createdAt -updatedAt");

  if (!category)
    throw new CustomError("Category not found", StatusCodes.NOT_FOUND);

  res.status(StatusCodes.OK).json(category);
};

// Staff get single category
export const getCategoryForStaff = async (req: Request, res: Response) => {
  const category = await Category.findById(req.params.id);
  if (!category)
    throw new CustomError("Category not found", StatusCodes.NOT_FOUND);

  res.status(StatusCodes.OK).json(category);
};

// Create category (staff only)
export const createCategory = async (req: Request, res: Response) => {
  onlyAdminCanSetReadOnly(req);

  const category = await Category.create(req.body);
  res.status(StatusCodes.CREATED).json(category);
};

// Update category (staff only)
export const updateCategory = async (req: Request, res: Response) => {
  const category = await Category.findById(req.params.id);
  if (!category)
    throw new CustomError("Category not found", StatusCodes.NOT_FOUND);

  onlyAdminCanModify(req, category);
  onlyAdminCanSetReadOnly(req);

  Object.assign(category, req.body);
  await category.save();

  res.status(StatusCodes.OK).json(category);
};

// Delete category (staff only)
export const deleteCategory = async (req: Request, res: Response) => {
  const category = await Category.findById(req.params.id);
  if (!category)
    throw new CustomError("Category not found", StatusCodes.NOT_FOUND);

  onlyAdminCanModify(req, category);

  await category.deleteOne();
  res.status(StatusCodes.OK).json({ message: "Category deleted successfully" });
};
