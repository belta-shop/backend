import { Router } from "express";
import {
  getAllSubCategories,
  getSubCategory,
  createSubCategory,
  updateSubCategory,
  deleteSubCategory,
  getAllSubCategoriesForStaff,
  getSubCategoryForStaff,
  linkSubCategoryToCategory,
  unlinkSubCategoryFromCategory,
} from "../../controllers/products/sub-category.controller";
import { authMiddleware, staffMiddleware } from "../../middleware/auth";

const router = Router();
const staffRouter = Router();
staffRouter.use(authMiddleware, staffMiddleware);
router.use("/staff", staffRouter);

router.get("/", getAllSubCategories);
staffRouter.route("/").get(getAllSubCategoriesForStaff).post(createSubCategory);

staffRouter.post("/link", linkSubCategoryToCategory);
staffRouter.post("/unlink", unlinkSubCategoryFromCategory);

router.get("/:id", getSubCategory);
staffRouter
  .route("/:id")
  .get(getSubCategoryForStaff)
  .patch(updateSubCategory)
  .delete(deleteSubCategory);
export default router;
