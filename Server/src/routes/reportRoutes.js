import { Router } from "express";
import * as reportController from "../controllers/reportController.js";
import { verifyAuth } from "../middleware/auth.js";

const router = Router();

router.use(verifyAuth);

router.get("/monthly", reportController.monthly);
router.get("/export/:format", reportController.exportReports);
router.get("/", reportController.list);
router.get("/:id", reportController.byId);
router.patch("/:id/status", reportController.updateStatus);

export default router;
