import { Router } from "express";
import {
  getAllTags,
  getTag,
  getAllTagsForStaff,
  getTagForStaff,
  createTag,
  updateTag,
  deleteTag,
  linkTagToProduct,
  unlinkTagFromProduct,
} from "../../controllers/products/tag.controller";
import { authMiddleware, staffMiddleware } from "../../middleware/auth";

const router = Router();
const staffRouter = Router();
staffRouter.use(authMiddleware, staffMiddleware);
router.use("/staff", staffRouter);

router.get("/", getAllTags);
staffRouter.route("/").get(getAllTagsForStaff).post(createTag);

staffRouter.post("/link", linkTagToProduct);
staffRouter.post("/unlink", unlinkTagFromProduct);

router.get("/:id", getTag);
staffRouter
  .route("/:id")
  .get(getTagForStaff)
  .patch(updateTag)
  .delete(deleteTag);

export default router;
