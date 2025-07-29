import { Router } from "express";
import { authMiddleware, clientMiddleware } from "../../middleware/auth";
import {
  clearCartSession,
  createCheckoutSession,
} from "../../controllers/carts/checkout.controller";

const router = Router();

router.use(authMiddleware);
router.use(clientMiddleware);

router.post("/create-session", createCheckoutSession);
router.post("/clear-session", clearCartSession);

export default router;
