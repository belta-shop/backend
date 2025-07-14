import { Router } from "express";
import { authMiddleware, clientMiddleware } from "../../middleware/auth";
import { staffMiddleware } from "../../middleware/auth";
import { activeCartController } from "../../controllers";

const {
  addProductToActiveCart,
  addProductToActiveCartForStaff,
  getActiveCart,
  getActiveCartForStaff,
  getAllActiveCarts,
  removeProductFromActiveCart,
  removeProductFromActiveCartForStaff,
} = activeCartController;

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
