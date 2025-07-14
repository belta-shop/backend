import { Router } from "express";
import authRouter from "./auth.route";
import uploadRouter from "./upload.route";
import categoryRouter from "./products/category.route";
import subCategoryRouter from "./products/sub-category.route";
import productRouter from "./products/product.route";
import offerRouter from "./products/offer.route";
import labelRouter from "./products/label.route";
import tagRouter from "./products/tag.route";
import brandRouter from "./products/brand.route";
import activeCartRouter from "./carts/active-cart.route";
import draftCartRouter from "./carts/draft-cart.route";
const router = Router();

router.use("/auth", authRouter);
router.use("/upload", uploadRouter);
router.use("/categories", categoryRouter);
router.use("/subcategories", subCategoryRouter);
router.use("/products", productRouter);
router.use("/offers", offerRouter);
router.use("/labels", labelRouter);
router.use("/tags", tagRouter);
router.use("/brands", brandRouter);
router.use("/active-carts", activeCartRouter);
router.use("/draft-carts", draftCartRouter);

export default router;
