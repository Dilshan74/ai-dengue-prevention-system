import { Router } from "express";
import * as phiController from "../controllers/phiController.js";
import { verifyAuth, requireRole } from "../middleware/auth.js";
import { upload } from "../middleware/upload.js";

const router = Router();

router.use(verifyAuth, requireRole("phi"));

router.get("/dashboard", phiController.dashboard);
router.get("/reports", phiController.listReports);
router.get("/reports/:id", phiController.getReport);
router.post("/reports/:id/accept", phiController.acceptReport);
router.post("/reports/:id/reject", phiController.rejectReport);
router.get("/visits", phiController.listVisits);
router.put("/visits/:id", phiController.updateVisit);
router.post("/visits/:id/photos", upload.array("photos", 10), phiController.uploadInspectionPhotos);
router.get("/profile", phiController.profile);
router.put("/profile", phiController.updateProfile);

export default router;
