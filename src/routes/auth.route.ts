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
import passport from "passport";
const router = Router();

router.post("/register", register);
router.post("/login", login);

router.get(
  "/github",
  passport.authenticate("github", { scope: ["user:email"] })
);
router.get(
  "/github/callback",
  passport.authenticate("github", { failureRedirect: "/login" }),
  function (req, res) {
    console.log(req.user);
    // Successful authentication, redirect home.
    res.redirect("/");
  }
);

router.post("/refresh-token", refreshAccessToken);
router.post("/send-otp", authMiddleware, resendOTP);
router.post("/verify-otp", authMiddleware, verifyOTP);
router.post("/send-guest-otp", getUserByEmailMiddleware, resendOTP);
router.post("/verify-guest-otp", getUserByEmailMiddleware, verifyOTP);
router.post("/reset-password", authMiddleware, resetPassword);

export default router;
