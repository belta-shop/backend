import { Router } from "express";
import authRouter from "./auth.route";
import categoryRouter from "./products/category.route";
import subCategoryRouter from "./products/sub-category.route";
import productRouter from "./products/product.route";
import offerRouter from "./products/offer.route";
import labelRouter from "./products/label.route";
import tagRouter from "./products/tag.route";

const router = Router();

router.use("/auth", authRouter);
router.use("/categories", categoryRouter);
router.use("/subcategories", subCategoryRouter);
router.use("/products", productRouter);
router.use("/offers", offerRouter);
router.use("/labels", labelRouter);
router.use("/tags", tagRouter);

export default router;
