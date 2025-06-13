import { v1 as uuidv1 } from "uuid";
import { containerClient } from "../db/blobStorage";
import { Metadata } from "../models/metadata";

export const generateMetadata = (file: Express.Multer.File) => {
  const id = uuidv1();
  const arr = file.originalname.split(".");
  arr[arr.length - 1] = `${id}.${arr[arr.length - 1]}`;

  return {
    blobName: arr.join("."),
    originalname: file.originalname,
    fileType: file.mimetype,
    size: file.size,
  };
};

export const uploadFile = async (file: Express.Multer.File) => {
  const { blobName, originalname, fileType, size } = generateMetadata(file);

  const blockBlobClient = containerClient.getBlockBlobClient(blobName);
  await blockBlobClient.upload(file.buffer, size);

  await Metadata.create({
    blobName,
    originalname,
    fileType,
    size,
  });

  return blockBlobClient.url;
};
