import { Router } from "express";
import {
  refreshAccessToken,
  login,
  register,
  resendOTP,
  verifyOTP,
  resetPassword,
  sendGuestOtp,
  verifyGuestOtp,
} from "../controllers/auth.controller";
import { authMiddleware } from "../middleware/auth";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.post("/refresh-token", refreshAccessToken);
router.post("/resend-otp", authMiddleware, resendOTP);
router.post("/verify-otp", authMiddleware, verifyOTP);
router.post("/reset-password", authMiddleware, resetPassword);
router.post("/send-guest-otp", sendGuestOtp);
router.post("/verify-guest-otp", verifyGuestOtp);

export default router;
