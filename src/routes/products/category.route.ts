import { Router } from "express";
import {
  getAllCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
  getAllCategoriesForStaff,
  getCategoryForStaff,
} from "../../controllers/products/category.controller";
import { authMiddleware, staffMiddleware } from "../../middleware/auth";

const router = Router();
const staffRouter = Router();
staffRouter.use(authMiddleware, staffMiddleware);
router.use("/staff", staffRouter);

router.get("/", getAllCategories);
staffRouter.route("/").get(getAllCategoriesForStaff).post(createCategory);

router.get("/:id", getCategory);
staffRouter
  .route("/:id")
  .get(getCategoryForStaff)
  .patch(updateCategory)
  .delete(deleteCategory);

export default router;
