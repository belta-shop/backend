import { Router } from "express";
import {
  refreshAccessToken,
  login,
  register,
  resendOTP,
  verifyOTP,
  resetPassword,
} from "../controlers/auth.controller";
import { authMiddleware } from "../middleware/auth";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.post("/refresh-token", refreshAccessToken);
router.post("/resend-otp", authMiddleware, resendOTP);
router.post("/verify-otp", authMiddleware, verifyOTP);
router.post("/reset-password", authMiddleware, resetPassword);

export default router;
