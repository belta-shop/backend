import { Router } from "express";
import { authMiddleware, clientMiddleware } from "../../middleware/auth";
import { staffMiddleware } from "../../middleware/auth";
import {
  addProductToDraftCart,
  addProductToDraftCartForStaff,
  getDraftCart,
  getDraftCartForStaff,
  getAllDraftCarts,
  removeProductFromDraftCart,
  removeProductFromDraftCartForStaff,
} from "../../controllers/carts/draft-cart.controller";

const router = Router();
const staffRouter = Router();

router.use(authMiddleware);
staffRouter.use(staffMiddleware);
router.use("/staff", staffRouter);

staffRouter
  .route("/")
  .get(getAllDraftCarts)
  .post(addProductToDraftCartForStaff)
  .delete(removeProductFromDraftCartForStaff);

staffRouter.route("/:userId").get(getDraftCartForStaff);

router.use(clientMiddleware);
router
  .route("/")
  .get(getDraftCart)
  .post(addProductToDraftCart)
  .delete(removeProductFromDraftCart);

export default router;
