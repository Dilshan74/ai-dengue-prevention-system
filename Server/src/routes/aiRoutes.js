import { Router } from "express";
import * as aiController from "../controllers/aiController.js";
import { verifyAuth } from "../middleware/auth.js";
import { upload } from "../middleware/upload.js";

const router = Router();

router.use(verifyAuth);

router.post("/predict", upload.single("image"), aiController.predict);
router.get("/predictions/:reportId", aiController.getPrediction);
router.get("/accuracy", aiController.accuracy);
router.post("/predictions/:reportId/feedback", aiController.feedback);

export default router;
