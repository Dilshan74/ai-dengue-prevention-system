import { Router } from "express";
import * as authController from "../controllers/authController.js";
import { verifyAuth } from "../middleware/auth.js";

const router = Router();

router.post("/login", authController.login);
router.post("/register", authController.register);
router.post("/logout", authController.logout);
router.get("/me", verifyAuth, authController.me);
router.post("/forgot-password", authController.forgotPassword);
router.post("/reset-password", authController.resetPassword);

export default router;
