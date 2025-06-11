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

router.get("/:id", getProduct);
staffRouter
  .route("/:id")
  .get(getProductForStaff)
  .patch(updateProduct)
  .delete(deleteProduct);

export default router;
