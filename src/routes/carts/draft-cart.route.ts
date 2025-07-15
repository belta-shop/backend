import { Router } from "express";
import { authMiddleware, clientMiddleware } from "../../middleware/auth";
import { staffMiddleware } from "../../middleware/auth";
import { draftCartController } from "../../controllers";

const {
  addProductToDraftCart,
  addProductToDraftCartForStaff,
  getDraftCart,
  getDraftCartForStaff,
  getAllDraftCarts,
  removeProductFromDraftCart,
  removeProductFromDraftCartForStaff,
} = draftCartController;

const router = Router();
const staffRouter = Router();

router.use(authMiddleware);
staffRouter.use(staffMiddleware);
router.use("/staff", staffRouter);

staffRouter.get("/", getAllDraftCarts);
staffRouter.route("/:userId").get(getDraftCartForStaff);
staffRouter.post("add", addProductToDraftCartForStaff);
staffRouter.post("remove", removeProductFromDraftCartForStaff);

router.use(clientMiddleware);
router.get("/", getDraftCart);
router.post("add", addProductToDraftCart);
router.post("remove", removeProductFromDraftCart);

export default router;
