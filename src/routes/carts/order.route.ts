import { Router } from "express";
import { authMiddleware, staffMiddleware } from "../../middleware/auth";
import {
  getAllOrders,
  getAllOrdersForStaff,
  getOrder,
  getOrderForStaff,
  orderAgain,
} from "../../controllers/carts/order.controller";

const router = Router();
const staffRouter = Router();

router.use(authMiddleware);
staffRouter.use(staffMiddleware);
router.use("/staff", staffRouter);

staffRouter.get("/", getAllOrdersForStaff);
staffRouter.get("/:orderId", getOrderForStaff);
router.get("/", getAllOrders); // clients only
router.get("/:orderId", getOrder);
router.post("/:orderId/order-again", orderAgain);

export default router;
