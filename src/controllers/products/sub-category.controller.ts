import { Request, Response } from "express";
import SubCategory from "../../models/products/sub-category.model";
import { StatusCodes } from "http-status-codes";
import Category from "../../models/products/category.model";
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

// Public get all subcategories
export const getAllSubCategories = async (req: Request, res: Response) => {
  const { search, categoryId } = req.query;
  const { skip, limit } = getPagination(req.query);

  const query: any = {
    disabled: false,
    ...getSearchQuery(search, ["nameAr", "nameEn"]),
  };

  if (categoryId) query.category = categoryId;

  const data = await SubCategory.aggregate(
    getPaginationPipline({
      beforePipline: [{ $match: query }, { $sort: { createdAt: -1 } }],
      skip,
      limit,
      dataPipline: [
        {
          $project: {
            name: req.lang === "ar" ? "$nameAr" : "$nameEn",
            cover: 1,
            category: 1,
          },
        },
      ],
    })
  );

  res.status(StatusCodes.OK).json(data[0] || emptyPaginationList(skip, limit));
};

// Staff get all subcategories
export const getAllSubCategoriesForStaff = async (
  req: Request,
  res: Response
) => {
  const { search, disabled, categoryId, employeeReadOnly } = req.query;
  const { skip, limit } = getPagination(req.query);

  const query: any = { ...getSearchQuery(search, ["nameAr", "nameEn"]) };

  if (disabled !== undefined) query.disabled = disabled === "true";
  if (categoryId) query.category = categoryId;
  if (employeeReadOnly !== undefined)
    query.employeeReadOnly = employeeReadOnly === "true";

  const data = await SubCategory.aggregate(
    getPaginationPipline({
      beforePipline: [
        ...getAggregatedLookup([
          { collection: "categories", fieldName: "category", isArray: false },
        ]),
        { $match: query },
        { $sort: { createdAt: -1 } },
      ],
      skip,
      limit,
      dataPipline: [
        {
          $project: {
            nameAr: 1,
            nameEn: 1,
            cover: 1,
            disabled: 1,
            employeeReadOnly: 1,
            products: 1,
            category: {
              _id: 1,
              nameAr: 1,
              nameEn: 1,
              cover: 1,
            },
          },
        },
      ],
    })
  );

  res.status(StatusCodes.OK).json(data[0] || emptyPaginationList(skip, limit));
};

// Public get single subcategory
export const getSubCategory = async (req: Request, res: Response) => {
  const subcategory = await SubCategory.findById(req.params.id)
    .select({
      name: req.lang === "ar" ? "$nameAr" : "$nameEn",
      cover: 1,
      category: 1,
    })
    .select("-createdAt -updatedAt")
    .populate("category", {
      name: req.lang === "ar" ? "$nameAr" : "$nameEn",
    });

  if (!subcategory)
    throw new CustomError("Subcategory not found", StatusCodes.NOT_FOUND);

  res.status(StatusCodes.OK).json(subcategory);
};

// Staff get single subcategory
export const getSubCategoryForStaff = async (req: Request, res: Response) => {
  const subcategory = await SubCategory.findById(req.params.id).populate([
    { path: "category" },
    {
      path: "products",
      populate: [
        {
          path: "brand",
        },
      ],
    },
  ]);

  if (!subcategory)
    throw new CustomError("Subcategory not found", StatusCodes.NOT_FOUND);

  res.status(StatusCodes.OK).json(subcategory);
};

// Create subcategory (staff only)
export const createSubCategory = async (req: Request, res: Response) => {
  onlyAdminCanSetReadOnly(req);

  const subcategory = await SubCategory.create(req.body);
  await subcategory.populate("category", "nameAr nameEn");

  res.status(StatusCodes.CREATED).json(subcategory);
};

// Update subcategory (staff only)
export const updateSubCategory = async (req: Request, res: Response) => {
  const subcategory = await SubCategory.findById(req.params.id);
  if (!subcategory)
    throw new CustomError("Subcategory not found", StatusCodes.NOT_FOUND);

  onlyAdminCanModify(req, subcategory);
  onlyAdminCanSetReadOnly(req);

  Object.assign(subcategory, req.body);
  await subcategory.save();
  await subcategory.populate("category", "nameAr nameEn");

  res.status(StatusCodes.OK).json(subcategory);
};

// Delete subcategory (staff only)
export const deleteSubCategory = async (req: Request, res: Response) => {
  const subcategory = await SubCategory.findById(req.params.id);
  if (!subcategory)
    throw new CustomError("Subcategory not found", StatusCodes.NOT_FOUND);

  onlyAdminCanModify(req, subcategory);

  await subcategory.deleteOne();
  res
    .status(StatusCodes.OK)
    .json({ message: "Subcategory deleted successfully" });
};

// Link subcategory to category (staff only)
export const linkSubCategoryToCategory = async (
  req: Request,
  res: Response
) => {
  const { subcategoryId, categoryId } = req.body;

  const subcategory = await SubCategory.findById(subcategoryId);
  if (!subcategory) {
    throw new CustomError("Subcategory not found", StatusCodes.NOT_FOUND);
  }

  onlyAdminCanModify(req, subcategory);

  if (subcategory.category)
    throw new CustomError(
      "Subcategory is already linked to a category",
      StatusCodes.BAD_REQUEST
    );

  const category = await Category.findById(categoryId);
  if (!category)
    throw new CustomError("Category not found", StatusCodes.NOT_FOUND);

  subcategory.category = categoryId;
  await subcategory.save();
  await subcategory.populate("category", "nameAr nameEn");

  category.subcategories.push(subcategoryId);
  await category.save();

  res.status(StatusCodes.OK).json(subcategory);
};

// Unlink subcategory from category (staff only)
export const unlinkSubCategoryFromCategory = async (
  req: Request,
  res: Response
) => {
  const { subcategoryId } = req.body;

  const subcategory = await SubCategory.findById(subcategoryId).populate(
    "category"
  );
  if (!subcategory)
    throw new CustomError("Subcategory not found", StatusCodes.NOT_FOUND);

  onlyAdminCanModify(req, subcategory);

  if (!subcategory.category)
    throw new CustomError(
      "Subcategory is not linked to any category",
      StatusCodes.BAD_REQUEST
    );

  const category = await Category.findById(subcategory.category);

  subcategory.category = null;
  await subcategory.save();

  if (category?.subcategories) {
    category.subcategories = category.subcategories.filter(
      (id) => id.toString() !== subcategoryId
    );
    await category.save();
  }

  res.status(StatusCodes.OK).json(subcategory);
};
