import { Router } from "express";
import * as mapController from "../controllers/mapController.js";
import { verifyAuth } from "../middleware/auth.js";

const router = Router();

router.use(verifyAuth);

router.get("/risk-areas", mapController.riskAreas);
router.get("/heatmap", mapController.heatmap);
router.get("/reports", mapController.mapReports);
router.get("/reverse-geocode", mapController.reverseGeocode);

export default router;
