import { Router } from "express";
import {
  getAllBrands,
  getBrand,
  getAllBrandsForStaff,
  getBrandForStaff,
  createBrand,
  updateBrand,
  deleteBrand,
} from "../../controllers/products/brand.controller";
import { authMiddleware, staffMiddleware } from "../../middleware/auth";

const router = Router();
const staffRouter = Router();
staffRouter.use(authMiddleware, staffMiddleware);
router.use("/staff", staffRouter);

router.get("/", getAllBrands);
staffRouter.route("/").get(getAllBrandsForStaff).post(createBrand);

router.get("/:id", getBrand);
staffRouter
  .route("/:id")
  .get(getBrandForStaff)
  .patch(updateBrand)
  .delete(deleteBrand);

export default router;
