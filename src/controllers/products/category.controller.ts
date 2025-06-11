import { Request, Response } from "express";
import Category from "../../models/products/category.model";
import ErrorAPI from "../../errors/error-api";
import { StatusCodes } from "http-status-codes";
import Unauthorized from "../../errors/unauthorized";
import { getPagination, getSearchQuery } from "../../utils/routes";

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
    .lean();

  const total = await Category.countDocuments(query);

  res.status(StatusCodes.OK).json({ items: categories, total });
};

// Staff get all categories
export const getAllCategoriesForStaff = async (req: Request, res: Response) => {
  const { search, disabled, employeeReadOnly } = req.query;
  const { skip, limit } = getPagination(req.query);

  let query: any = { ...getSearchQuery(search, ["nameAr", "nameEn"]) };

  if (disabled !== undefined) {
    query.disabled = disabled === "true";
  }

  if (employeeReadOnly !== undefined) {
    query.employeeReadOnly = employeeReadOnly === "true";
  }

  const categories = await Category.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await Category.countDocuments(query);

  res.status(StatusCodes.OK).json({ items: categories, total });
};

// Public get single category
export const getCategory = async (req: Request, res: Response) => {
  const category = await Category.findById(req.params.id).select({
    name: req.lang === "ar" ? "$nameAr" : "$nameEn",
    cover: 1,
  });

  if (!category) {
    throw new ErrorAPI("Category not found", StatusCodes.NOT_FOUND);
  }

  res.status(StatusCodes.OK).json(category);
};

// Staff get single category
export const getCategoryForStaff = async (req: Request, res: Response) => {
  const category = await Category.findById(req.params.id);
  if (!category) {
    throw new ErrorAPI("Category not found", StatusCodes.NOT_FOUND);
  }
  res.status(StatusCodes.OK).json(category);
};

// Create category (staff only)
export const createCategory = async (req: Request, res: Response) => {
  const { employeeReadOnly } = req.body;

  // Only admin can set employeeReadOnly to true
  if (employeeReadOnly && req.currentUser?.role !== "admin") {
    throw new Unauthorized("Only admin can set employeeReadOnly to true");
  }

  const category = await Category.create(req.body);
  res.status(StatusCodes.CREATED).json(category);
};

// Update category (staff only)
export const updateCategory = async (req: Request, res: Response) => {
  const category = await Category.findById(req.params.id);
  if (!category) {
    throw new ErrorAPI("Category not found", StatusCodes.NOT_FOUND);
  }

  // Check if employee is trying to modify employeeReadOnly
  if (
    req.body.employeeReadOnly !== undefined &&
    req.currentUser?.role !== "admin"
  ) {
    throw new Unauthorized("Only admin can modify employeeReadOnly");
  }

  // Check if employee is trying to modify an employeeReadOnly category
  if (category.employeeReadOnly && req.currentUser?.role !== "admin") {
    throw new Unauthorized("This category can only be modified by admin");
  }

  Object.assign(category, req.body);
  await category.save();

  res.status(StatusCodes.OK).json(category);
};

// Delete category (staff only)
export const deleteCategory = async (req: Request, res: Response) => {
  const category = await Category.findById(req.params.id);
  if (!category) {
    throw new ErrorAPI("Category not found", StatusCodes.NOT_FOUND);
  }

  // Check if employee is trying to delete an employeeReadOnly category
  if (category.employeeReadOnly && req.currentUser?.role !== "admin") {
    throw new Unauthorized("This category can only be deleted by admin");
  }

  await category.deleteOne();
  res.status(StatusCodes.OK).json({ message: "Category deleted successfully" });
};
