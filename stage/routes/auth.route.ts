import { Router } from "express";
import {
  refreshAccessToken,
  login,
  register,
} from "../controlers/auth.controller";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.post("/refresh-token", refreshAccessToken);

export default router;
