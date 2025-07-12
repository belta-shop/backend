import { Request, Response } from "express";
import Brand from "../../models/products/brand.model";
import { StatusCodes } from "http-status-codes";
import {
  getPagination,
  getSearchQuery,
  onlyAdminCanModify,
  onlyAdminCanSetReadOnly,
} from "../../utils/routes";
import CustomError from "../../errors/custom-error";
import { emptyPaginationList, getPaginationPipline } from "../../utils/models";

// Staff get all brands
export const getAllBrandsForStaff = async (req: Request, res: Response) => {
  const { search, disabled, employeeReadOnly } = req.query;
  const { skip, limit } = getPagination(req.query);

  let query: any = {
    ...getSearchQuery(search, ["nameAr", "nameEn"]),
  };

  if (disabled !== undefined) query.disabled = disabled === "true";
  if (employeeReadOnly !== undefined)
    query.employeeReadOnly = employeeReadOnly === "true";

  const data = await Brand.aggregate(
    getPaginationPipline({
      beforePipline: [{ $match: query }, { $sort: { createdAt: -1 } }],
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
          },
        },
      ],
    })
  );

  res.status(StatusCodes.OK).json(data[0] || emptyPaginationList(skip, limit));
};

// Client get all brands
export const getAllBrands = async (req: Request, res: Response) => {
  const { search } = req.query;
  const { skip, limit } = getPagination(req.query);

  let query: any = {
    disabled: false,
    ...getSearchQuery(search, ["nameAr", "nameEn"]),
  };
  const data = await Brand.aggregate(
    getPaginationPipline({
      beforePipline: [{ $match: query }, { $sort: { createdAt: -1 } }],
      skip,
      limit,
      dataPipline: [
        {
          $project: {
            name: req.lang === "ar" ? "$nameAr" : "$nameEn",
            cover: 1,
          },
        },
      ],
    })
  );

  res.status(StatusCodes.OK).json(data[0] || emptyPaginationList(skip, limit));
};

// Staff get single brand
export const getBrandForStaff = async (req: Request, res: Response) => {
  const brand = await Brand.findById(req.params.id).populate({
    path: "products",
    populate: [
      {
        path: "subcategory",
      },
    ],
  });

  if (!brand) throw new CustomError("Brand not found", StatusCodes.NOT_FOUND);

  res.status(StatusCodes.OK).json(brand);
};

// Client get single brand
export const getBrand = async (req: Request, res: Response) => {
  const brand = await Brand.findById(req.params.id)
    .select({
      name: req.lang === "ar" ? "$nameAr" : "$nameEn",
      cover: 1,
    })
    .populate("products")
    .select("-createdAt -updatedAt");

  if (!brand) throw new CustomError("Brand not found", StatusCodes.NOT_FOUND);

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
  if (!brand) throw new CustomError("Brand not found", StatusCodes.NOT_FOUND);

  onlyAdminCanSetReadOnly(req);
  onlyAdminCanModify(req, brand);

  Object.assign(brand, req.body);
  await brand.save();

  res.status(StatusCodes.OK).json(brand);
};

// Delete brand (staff only)
export const deleteBrand = async (req: Request, res: Response) => {
  const brand = await Brand.findById(req.params.id);
  if (!brand) throw new CustomError("Brand not found", StatusCodes.NOT_FOUND);

  onlyAdminCanModify(req, brand);

  await brand.deleteOne();
  res.status(StatusCodes.OK).json({ message: "Brand deleted successfully" });
};
