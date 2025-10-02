import { Router } from "express";
import {
  refreshAccessToken,
  login,
  register,
  resendOTP,
  verifyOTP,
  resetPassword,
  githubCallback,
  registerGithub,
} from "../controllers/auth.controller";
import { authMiddleware } from "../middleware/auth";
import { getUserByEmailMiddleware } from "../middleware/get-user-by-email";
import passport from "passport";
import BadRequest from "../errors/bad-request";
const router = Router();

router.post("/register", register);
router.post("/register-github", registerGithub);
router.post("/login", login);
router.get("/github", (req, res, next) => {
  const { newAccountUrl, loginUrl, failureUrl } = req.query;

  if (
    !newAccountUrl ||
    !loginUrl ||
    !failureUrl ||
    typeof failureUrl !== "string"
  )
    throw new BadRequest("newAccountUrl, loginUrl and failureUrl are required");

  passport.authenticate("github", {
    scope: ["user:email"],
    state: JSON.stringify({ newAccountUrl, loginUrl, failureUrl }),
    failureRedirect: failureUrl,
  })(req, res, next);
});

router.get("/github/callback", passport.authenticate("github"), githubCallback);

router.post("/refresh-token", refreshAccessToken);
router.post("/send-otp", authMiddleware, resendOTP);
router.post("/verify-otp", authMiddleware, verifyOTP);
router.post("/send-guest-otp", getUserByEmailMiddleware, resendOTP);
router.post("/verify-guest-otp", getUserByEmailMiddleware, verifyOTP);
router.post("/reset-password", authMiddleware, resetPassword);

export default router;
