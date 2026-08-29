import express from 'express';
import { getRiskData, updateRiskData } from '../controllers/dengueRiskController.js';
import { verifyAuth, requireRole } from '../middleware/auth.js'; 

const router = express.Router();

// Public route to get dengue risk data
router.get('/', getRiskData);

// Admin only route to manually trigger update
router.post('/update', verifyAuth, requireRole('Admin'), updateRiskData);

export default router;
