import { Router } from "express";
import {
  refreshAccessToken,
  login,
  register,
  resendOTP,
  verifyOTP,
  resetPassword,
} from "../controllers/auth.controller";
import { authMiddleware } from "../middleware/auth";
import { getUserByEmailMiddleware } from "../middleware/get-user-by-email";
const router = Router();

router.post("/register", register);
router.post("/login", login);
router.post("/refresh-token", refreshAccessToken);
router.post("/send-otp", authMiddleware, resendOTP);
router.post("/verify-otp", authMiddleware, verifyOTP);
router.post(
  "/send-guest-otp",
  getUserByEmailMiddleware,
  authMiddleware,
  resendOTP
);
router.post(
  "/verify-guest-otp",
  getUserByEmailMiddleware,
  authMiddleware,
  verifyOTP
);
router.post("/reset-password", authMiddleware, resetPassword);

export default router;
