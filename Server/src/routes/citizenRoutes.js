import { Router } from "express";
import * as citizenController from "../controllers/citizenController.js";
import { verifyAuth, requireRole } from "../middleware/auth.js";
import { upload } from "../middleware/upload.js";

const router = Router();

router.use(verifyAuth, requireRole("citizen"));

router.get("/dashboard", citizenController.dashboard);
router.get("/complaints", citizenController.listComplaints);
router.get("/complaints/:id", citizenController.getComplaint);
router.post("/complaints", upload.array("image", 5), citizenController.createComplaint);
router.get("/profile", citizenController.profile);
router.put("/profile", citizenController.updateProfile);
router.put("/settings", citizenController.updateSettings);

export default router;
