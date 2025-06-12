import { Router } from "express";
import {
  getAllProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  getAllProductsForStaff,
  getProductForStaff,
  linkProductToSubCategory,
  unlinkProductFromSubCategory,
  linkProductToBrand,
  unlinkProductFromBrand,
} from "../../controllers/products/product.controller";
import { authMiddleware, staffMiddleware } from "../../middleware/auth";

const router = Router();
const staffRouter = Router();
staffRouter.use(authMiddleware, staffMiddleware);
router.use("/staff", staffRouter);

router.get("/", getAllProducts);
staffRouter.route("/").get(getAllProductsForStaff).post(createProduct);

staffRouter.post("/link", linkProductToSubCategory);
staffRouter.post("/unlink", unlinkProductFromSubCategory);
staffRouter.post("/link-brand", linkProductToBrand);
staffRouter.post("/unlink-brand", unlinkProductFromBrand);

router.get("/:id", getProduct);
staffRouter
  .route("/:id")
  .get(getProductForStaff)
  .patch(updateProduct)
  .delete(deleteProduct);

export default router;
