import { Router } from "express";
import {
  refreshAccessToken,
  login,
  register,
  resendOTP,
  verifyOTP,
  resetPassword,
} from "../controlers/auth.controller";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.post("/refresh-token", refreshAccessToken);
router.post("/resend-otp", resendOTP);
router.post("/verify-otp", verifyOTP);
router.post("/reset-password", resetPassword);

export default router;
