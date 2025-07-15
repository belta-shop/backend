import { Router } from "express";
import { authMiddleware, clientMiddleware } from "../../middleware/auth";
import { staffMiddleware } from "../../middleware/auth";
import { activeCartController } from "../../controllers";
import { addMultiProductsToActiveCart } from "../../controllers/carts/active-cart.controller";

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

staffRouter.get("/", getAllActiveCarts);
staffRouter.get("/:userId", getActiveCartForStaff);
staffRouter.post("/add", addProductToActiveCartForStaff);
staffRouter.post("/remove", removeProductFromActiveCartForStaff);

router.use(clientMiddleware);
router.get("/", getActiveCart);
router.post("/add", addProductToActiveCart);
router.post("/add-multiple", addMultiProductsToActiveCart);
router.post("/remove", removeProductFromActiveCart);

export default router;
