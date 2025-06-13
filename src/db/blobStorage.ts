import { BlobServiceClient } from "@azure/storage-blob";

const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
if (!connectionString) throw Error("Azure Storage Connection string not found");
const containerName = process.env.AZURE_STORAGE_CONTAINER_NAME;
if (!containerName) throw Error("Azure Storage containerName not found");

const blobServiceClient =
  BlobServiceClient.fromConnectionString(connectionString);

export const containerClient =
  blobServiceClient.getContainerClient(containerName);
