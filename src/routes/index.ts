import { Router } from "express";
import authRouter from "./auth.route";
import categoryRouter from "./products/category.route";
import subCategoryRouter from "./products/sub-category.route";

const router = Router();

router.use("/auth", authRouter);
router.use("/categories", categoryRouter);
router.use("/subcategories", subCategoryRouter);

export default router;
