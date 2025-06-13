import { Request, Response } from "express";
import CustomError from "../errors/custom-error";
import ErrorAPI from "../errors/error-api";
import { uploadFile } from "../utils/file";

export const uploadSingleFile = async (req: Request, res: Response) => {
  if (!req.file) throw new CustomError("No file uploaded", 400);

  if (req.file.size > 1024 * 1024 * 10)
    throw new ErrorAPI("file_too_large", 400);

  const url = await uploadFile(req.file);

  res.status(200).json({ url });
};

export const uploadMultipleFiles = async (req: Request, res: Response) => {
  if (!req.files) throw new CustomError("No files uploaded", 400);

  const files = req.files as Express.Multer.File[];

  if (files.length === 0) throw new CustomError("No files uploaded", 400);

  if (files.some((file) => file.size > 1024 * 1024 * 10))
    throw new ErrorAPI("file_too_large", 400);

  const urls = await Promise.all(files.map(uploadFile));

  res.status(200).json({ urls });
};
