import { Router } from "express";
import { authMiddleware, clientMiddleware } from "../../middleware/auth";
import {
  createCheckoutSession,
  successCheckoutSession,
} from "../../controllers/carts/checkout.controller";

const router = Router();

router.get("/success/:sessionId", successCheckoutSession);

router.use(authMiddleware);
router.use(clientMiddleware);

router.post("/create-session", createCheckoutSession);

export default router;
