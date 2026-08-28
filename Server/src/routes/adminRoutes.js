import { Router } from "express";
import * as adminController from "../controllers/adminController.js";
import { verifyAuth, requireRole } from "../middleware/auth.js";

const router = Router();

router.use(verifyAuth, requireRole("admin"));

router.get("/dashboard", adminController.dashboard);

router.get("/users", adminController.listUsers);
router.post("/users", adminController.createUser);
router.put("/users/:id", adminController.updateUser);
router.patch("/users/:id/status", adminController.toggleUserStatus);
router.delete("/users/:id", adminController.deleteUser);

router.get("/phis", adminController.listPhis);
router.post("/phis", adminController.createPhi);
router.put("/phis/:phiId/area", adminController.assignArea);

// ---- Complaint / Report management ----
router.get("/reports", adminController.listReports);
router.get("/reports/:id", adminController.getReport);
router.patch("/reports/:id/assign", adminController.assignPhiToReport);
router.patch("/reports/:id/status", adminController.adminUpdateStatus);

router.get("/areas", adminController.listAreas);
router.post("/areas", adminController.createArea);
router.put("/areas/:id", adminController.updateArea);
router.delete("/areas/:id", adminController.deleteArea);

router.get("/statistics", adminController.statistics);
router.get("/settings", adminController.getSettings);
router.put("/settings", adminController.updateSettings);

export default router;

