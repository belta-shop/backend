import { Router } from "express";
import { authMiddleware, clientMiddleware } from "../../middleware/auth";
import { staffMiddleware } from "../../middleware/auth";
import {
  addProductToActiveCart,
  addProductToActiveCartForStaff,
  getActiveCart,
  getActiveCartForStaff,
  getAllActiveCarts,
  removeProductFromActiveCart,
  removeProductFromActiveCartForStaff,
} from "../../controllers/carts/active-cart.controller";

const router = Router();
const staffRouter = Router();

router.use(authMiddleware);
staffRouter.use(staffMiddleware);
router.use("/staff", staffRouter);

staffRouter
  .route("/")
  .get(getAllActiveCarts)
  .post(addProductToActiveCartForStaff)
  .delete(removeProductFromActiveCartForStaff);

staffRouter.route("/:userId").get(getActiveCartForStaff);

router.use(clientMiddleware);
router
  .route("/")
  .get(getActiveCart)
  .post(addProductToActiveCart)
  .delete(removeProductFromActiveCart);

export default router;
