import { Router } from "express";
import {
  getAllLabels,
  getLabel,
  getAllLabelsForStaff,
  getLabelForStaff,
  createLabel,
  updateLabel,
  deleteLabel,
  linkLabelToProduct,
  unlinkLabelFromProduct,
} from "../../controllers/products/label.controller";
import { authMiddleware, staffMiddleware } from "../../middleware/auth";

const router = Router();
const staffRouter = Router();
staffRouter.use(authMiddleware, staffMiddleware);
router.use("/staff", staffRouter);

router.get("/", getAllLabels);
staffRouter.route("/").get(getAllLabelsForStaff).post(createLabel);

staffRouter.post("/link", linkLabelToProduct);
staffRouter.post("/unlink", unlinkLabelFromProduct);

router.get("/:id", getLabel);
staffRouter
  .route("/:id")
  .get(getLabelForStaff)
  .patch(updateLabel)
  .delete(deleteLabel);

export default router;
