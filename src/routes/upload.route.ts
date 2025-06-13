import { Router } from "express";
import multer from "multer";
import {
  uploadSingleFile,
  uploadMultipleFiles,
} from "../controllers/upload.controller";
const upload = multer();

const router = Router();

router.post("/single", upload.single("file"), uploadSingleFile);
router.post("/multiple", upload.array("files"), uploadMultipleFiles);

export default router;
