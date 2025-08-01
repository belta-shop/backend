import { Request, Response } from "express";
import Label from "../../models/products/label.model";
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

// Staff get all labels
export const getAllLabelsForStaff = async (req: Request, res: Response) => {
  const { search, color, employeeReadOnly } = req.query;
  const { skip, limit } = getPagination(req.query);

  let query: any = {
    ...getSearchQuery(search, ["nameAr", "nameEn"]),
    ...getSearchQuery(color, ["color"]),
  };

  if (employeeReadOnly !== undefined)
    query.employeeReadOnly = employeeReadOnly === "true";

  const data = await Label.aggregate(
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
            products: 1,
            employeeReadOnly: 1,
          },
        },
      ],
    })
  );

  res.status(StatusCodes.OK).json(data[0] || emptyPaginationList(skip, limit));
};

// Client get all labels
export const getAllLabels = async (req: Request, res: Response) => {
  const { search, color } = req.query;
  const { skip, limit } = getPagination(req.query);

  let query: any = {
    ...getSearchQuery(search, ["nameAr", "nameEn"]),
    ...getSearchQuery(color, ["color"]),
  };

  const data = await Label.aggregate(
    getPaginationPipline({
      beforePipline: [{ $match: query }, { $sort: { createdAt: -1 } }],
      skip,
      limit,
      dataPipline: [
        {
          $project: {
            name: req.lang === "ar" ? "$nameAr" : "$nameEn",
            color: 1,
          },
        },
      ],
    })
  );

  res.status(StatusCodes.OK).json(data[0] || emptyPaginationList(skip, limit));
};

// Staff get single label
export const getLabelForStaff = async (req: Request, res: Response) => {
  const label = await Label.findById(req.params.id).populate({
    path: "products",
    populate: [{ path: "brand" }, { path: "subcategory" }],
  });

  if (!label) throw new CustomError("Label not found", StatusCodes.NOT_FOUND);

  res.status(StatusCodes.OK).json(label);
};

// Client get single label
export const getLabel = async (req: Request, res: Response) => {
  const label = await Label.findById(req.params.id)
    .select({
      name: req.lang === "ar" ? "$nameAr" : "$nameEn",
      color: 1,
    })
    .select("-createdAt -updatedAt");

  if (!label) throw new CustomError("Label not found", StatusCodes.NOT_FOUND);

  res.status(StatusCodes.OK).json(label);
};

// Create label (staff only)
export const createLabel = async (req: Request, res: Response) => {
  onlyAdminCanSetReadOnly(req);

  const label = await Label.create(req.body);
  res.status(StatusCodes.CREATED).json(label);
};

// Update label (staff only)
export const updateLabel = async (req: Request, res: Response) => {
  const label = await Label.findById(req.params.id);
  if (!label) throw new CustomError("Label not found", StatusCodes.NOT_FOUND);

  onlyAdminCanModify(req, label);
  onlyAdminCanSetReadOnly(req);

  Object.assign(label, req.body);
  await label.save();

  res.status(StatusCodes.OK).json(label);
};

// Delete label (staff only)
export const deleteLabel = async (req: Request, res: Response) => {
  const label = await Label.findById(req.params.id);
  if (!label) throw new CustomError("Label not found", StatusCodes.NOT_FOUND);

  onlyAdminCanModify(req, label);

  // Remove label from all products
  await Product.updateMany(
    { labels: label._id },
    { $pull: { labels: label._id } }
  );

  await label.deleteOne();
  res.status(StatusCodes.OK).json({ message: "Label deleted successfully" });
};

// Link label to product (staff only)
export const linkLabelToProduct = async (req: Request, res: Response) => {
  const { productId, labelId } = req.body;

  const product = await Product.findById(productId);
  if (!product)
    throw new CustomError("Product not found", StatusCodes.NOT_FOUND);

  const label = await Label.findById(labelId);
  if (!label) throw new CustomError("Label not found", StatusCodes.NOT_FOUND);

  if (product.labels.includes(labelId))
    throw new CustomError(
      "Product is already linked to this label",
      StatusCodes.BAD_REQUEST
    );

  onlyAdminCanModify(req, product);

  product.labels.push(labelId);
  await product.save();
  label.products.push(productId);
  await label.save();

  await product.populate([
    { path: "brand" },
    { path: "subcategory" },
    { path: "labels" },
    { path: "tags" },
    { path: "offer" },
  ]);

  res.status(StatusCodes.OK).json(product);
};

// Unlink label from product (staff only)
export const unlinkLabelFromProduct = async (req: Request, res: Response) => {
  const { productId, labelId } = req.body;

  const product = await Product.findById(productId);
  if (!product)
    throw new CustomError("Product not found", StatusCodes.NOT_FOUND);

  const label = await Label.findById(labelId);
  if (!label) throw new CustomError("Label not found", StatusCodes.NOT_FOUND);

  if (!product.labels.includes(labelId))
    throw new CustomError(
      "Product is not linked to this label",
      StatusCodes.BAD_REQUEST
    );

  onlyAdminCanModify(req, product);

  product.labels = product.labels.filter((id) => id.toString() !== labelId);
  await product.save();
  label.products = label.products.filter((id) => id.toString() !== productId);
  await label.save();

  await product.populate([
    { path: "brand" },
    { path: "subcategory" },
    { path: "labels" },
    { path: "tags" },
    { path: "offer" },
  ]);

  res.status(StatusCodes.OK).json(product);
};
