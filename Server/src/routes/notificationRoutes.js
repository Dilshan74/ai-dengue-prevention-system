import { Router } from "express";
import * as notificationController from "../controllers/notificationController.js";
import { verifyAuth } from "../middleware/auth.js";

const router = Router();

router.use(verifyAuth);

router.get("/unread-count", notificationController.unreadCount);
router.patch("/read-all", notificationController.markAllRead);
router.get("/", notificationController.list);
router.patch("/:id/read", notificationController.markRead);

export default router;
