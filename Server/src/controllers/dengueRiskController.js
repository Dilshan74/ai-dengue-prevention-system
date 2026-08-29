import DengueRisk from '../models/dengueRisk.js';
import { updateNDCUDengueData } from '../services/ndcuService.js';

// GET /api/dengue-risk
export const getRiskData = async (req, res) => {
  try {
    const riskData = await DengueRisk.find({});
    
    // Find the latest updated date
    let lastUpdated = null;
    if (riskData.length > 0) {
      lastUpdated = riskData.reduce((latest, current) => {
        return (new Date(latest.lastUpdated) > new Date(current.lastUpdated)) ? latest : current;
      }).lastUpdated;
    }

    res.status(200).json({
      success: true,
      lastUpdated,
      data: riskData
    });
  } catch (error) {
    console.error('Error fetching dengue risk data:', error);
    res.status(500).json({ success: false, message: 'Server error fetching risk data' });
  }
};

// POST /api/dengue-risk/update
export const updateRiskData = async (req, res) => {
  try {
    const result = await updateNDCUDengueData();
    res.status(result.success ? 200 : 500).json(result);
  } catch (error) {
    console.error('Error manually updating dengue risk data:', error);
    res.status(500).json({ success: false, message: 'Server error updating risk data' });
  }
};
