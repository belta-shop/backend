import { Request, Response } from "express";
import Tag from "../../models/products/tag.model";
import Product from "../../models/products/product.model";
import { StatusCodes } from "http-status-codes";
import {
  getPagination,
  getSearchQuery,
  onlyAdminCanModify,
  onlyAdminCanSetReadOnly,
} from "../../utils/routes";
import CustomError from "../../errors/custom-error";
import { emptyPaginationList, getPaginationPipline } from "../../utils/models";

// Staff get all tags
export const getAllTagsForStaff = async (req: Request, res: Response) => {
  const { search, disabled, employeeReadOnly } = req.query;
  const { skip, limit } = getPagination(req.query);

  let query: any = {
    ...getSearchQuery(search, ["nameAr", "nameEn"]),
  };

  if (disabled !== undefined) query.disabled = disabled === "true";
  if (employeeReadOnly !== undefined)
    query.employeeReadOnly = employeeReadOnly === "true";

  const data = await Tag.aggregate(
    getPaginationPipline({
      beforePipline: [{ $match: query }, { $sort: { createdAt: -1 } }],
      skip,
      limit,
      dataPipline: [
        {
          $project: {
            nameAr: 1,
            nameEn: 1,
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

// Client get all tags
export const getAllTags = async (req: Request, res: Response) => {
  const { search } = req.query;
  const { skip, limit } = getPagination(req.query);

  let query: any = {
    disabled: false,
    ...getSearchQuery(search, ["nameAr", "nameEn"]),
  };

  const data = await Tag.aggregate(
    getPaginationPipline({
      beforePipline: [{ $match: query }, { $sort: { createdAt: -1 } }],
      skip,
      limit,
      dataPipline: [
        {
          $project: {
            name: req.lang === "ar" ? "$nameAr" : "$nameEn",
          },
        },
      ],
    })
  );

  res.status(StatusCodes.OK).json(data[0] || emptyPaginationList(skip, limit));
};

// Staff get single tag
export const getTagForStaff = async (req: Request, res: Response) => {
  const tag = await Tag.findById(req.params.id).populate({
    path: "products",
    populate: [{ path: "brand" }, { path: "subcategory" }],
  });

  if (!tag) throw new CustomError("Tag not found", StatusCodes.NOT_FOUND);

  res.status(StatusCodes.OK).json(tag);
};

// Client get single tag
export const getTag = async (req: Request, res: Response) => {
  const tag = await Tag.findById(req.params.id)
    .select({
      name: req.lang === "ar" ? "$nameAr" : "$nameEn",
    })
    .select("-createdAt -updatedAt");

  if (!tag) throw new CustomError("Tag not found", StatusCodes.NOT_FOUND);

  res.status(StatusCodes.OK).json(tag);
};

// Create tag (staff only)
export const createTag = async (req: Request, res: Response) => {
  onlyAdminCanSetReadOnly(req);

  const tag = await Tag.create(req.body);
  res.status(StatusCodes.CREATED).json(tag);
};

// Update tag (staff only)
export const updateTag = async (req: Request, res: Response) => {
  const tag = await Tag.findById(req.params.id).populate("products");
  if (!tag) throw new CustomError("Tag not found", StatusCodes.NOT_FOUND);

  onlyAdminCanModify(req, tag);
  onlyAdminCanSetReadOnly(req);

  Object.assign(tag, req.body);
  await tag.save();

  res.status(StatusCodes.OK).json(tag);
};

// Delete tag (staff only)
export const deleteTag = async (req: Request, res: Response) => {
  const tag = await Tag.findById(req.params.id);
  if (!tag) throw new CustomError("Tag not found", StatusCodes.NOT_FOUND);

  onlyAdminCanModify(req, tag);

  // Remove tag from all products
  await Product.updateMany({ tags: tag._id }, { $pull: { tags: tag._id } });

  await tag.deleteOne();
  res.status(StatusCodes.OK).json({ success: true });
};

// Link tag to product (staff only)
export const linkTagToProduct = async (req: Request, res: Response) => {
  const { productId, tagId } = req.body;

  const product = await Product.findById(productId);
  if (!product)
    throw new CustomError("Product not found", StatusCodes.NOT_FOUND);

  const tag = await Tag.findById(tagId);
  if (!tag) throw new CustomError("Tag not found", StatusCodes.NOT_FOUND);

  if (product.tags.includes(tagId))
    throw new CustomError(
      "Product is already linked to this tag",
      StatusCodes.BAD_REQUEST
    );

  onlyAdminCanModify(req, product);

  product.tags.push(tagId);
  await product.save();
  tag.products.push(productId);
  await tag.save();

  await product.populate([
    { path: "brand" },
    { path: "subcategory" },
    { path: "labels" },
    { path: "tags" },
    { path: "offer" },
  ]);

  res.status(StatusCodes.OK).json(product);
};

// Unlink tag from product (staff only)
export const unlinkTagFromProduct = async (req: Request, res: Response) => {
  const { productId, tagId } = req.body;

  const product = await Product.findById(productId);
  if (!product)
    throw new CustomError("Product not found", StatusCodes.NOT_FOUND);

  const tag = await Tag.findById(tagId);
  if (!tag) throw new CustomError("Tag not found", StatusCodes.NOT_FOUND);

  if (!product.tags.includes(tagId))
    throw new CustomError(
      "Product is not linked to this tag",
      StatusCodes.BAD_REQUEST
    );

  onlyAdminCanModify(req, product);

  product.tags = product.tags.filter((id) => id.toString() !== tagId);
  await product.save();
  tag.products = tag.products.filter((id) => id.toString() !== productId);
  await tag.save();

  await product.populate([
    { path: "brand" },
    { path: "subcategory" },
    { path: "labels" },
    { path: "tags" },
    { path: "offer" },
  ]);

  res.status(StatusCodes.OK).json(product);
};
