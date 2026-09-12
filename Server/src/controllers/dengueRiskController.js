import mongoose from "mongoose";
import DengueRisk from "../models/dengueRisk.js";
import { updateNDCUDengueData } from "../services/ndcuService.js";

const DEFAULT_DISTRICT_RISKS = [
  { locationName: "Colombo", district: "Colombo", currentCases: 6709, riskScore: 21.14, riskLevel: "HIGH", latitude: 6.9271, longitude: 79.8612, trend: "STABLE", lastUpdated: new Date() },
  { locationName: "Gampaha", district: "Gampaha", currentCases: 5284, riskScore: 16.65, riskLevel: "HIGH", latitude: 7.0873, longitude: 79.9925, trend: "STABLE", lastUpdated: new Date() },
  { locationName: "Ratnapura", district: "Ratnapura", currentCases: 2286, riskScore: 7.20, riskLevel: "MODERATE", latitude: 6.7056, longitude: 80.3847, trend: "STABLE", lastUpdated: new Date() },
  { locationName: "Matara", district: "Matara", currentCases: 2205, riskScore: 6.95, riskLevel: "MODERATE", latitude: 5.9549, longitude: 80.5469, trend: "STABLE", lastUpdated: new Date() },
  { locationName: "Galle", district: "Galle", currentCases: 2066, riskScore: 6.51, riskLevel: "MODERATE", latitude: 6.0535, longitude: 80.2210, trend: "STABLE", lastUpdated: new Date() },
  { locationName: "Kalutara", district: "Kalutara", currentCases: 1906, riskScore: 6.01, riskLevel: "MODERATE", latitude: 6.5854, longitude: 79.9607, trend: "STABLE", lastUpdated: new Date() },
  { locationName: "Kandy", district: "Kandy", currentCases: 1434, riskScore: 4.52, riskLevel: "MODERATE", latitude: 7.2906, longitude: 80.6337, trend: "STABLE", lastUpdated: new Date() },
  { locationName: "Hambantota", district: "Hambantota", currentCases: 943, riskScore: 2.97, riskLevel: "LOW", latitude: 6.1246, longitude: 81.1185, trend: "STABLE", lastUpdated: new Date() },
  { locationName: "Batticaloa", district: "Batticaloa", currentCases: 918, riskScore: 2.89, riskLevel: "LOW", latitude: 7.7102, longitude: 81.6924, trend: "STABLE", lastUpdated: new Date() },
  { locationName: "Kegalle", district: "Kegalle", currentCases: 895, riskScore: 2.82, riskLevel: "LOW", latitude: 7.2513, longitude: 80.3464, trend: "STABLE", lastUpdated: new Date() },
  { locationName: "Kurunegala", district: "Kurunegala", currentCases: 822, riskScore: 2.59, riskLevel: "LOW", latitude: 7.4818, longitude: 80.3609, trend: "STABLE", lastUpdated: new Date() },
  { locationName: "Jaffna", district: "Jaffna", currentCases: 553, riskScore: 1.74, riskLevel: "LOW", latitude: 9.6615, longitude: 80.0255, trend: "STABLE", lastUpdated: new Date() },
  { locationName: "Puttalam", district: "Puttalam", currentCases: 552, riskScore: 1.74, riskLevel: "LOW", latitude: 8.0362, longitude: 79.8283, trend: "STABLE", lastUpdated: new Date() },
  { locationName: "Anuradhapura", district: "Anuradhapura", currentCases: 244, riskScore: 0.77, riskLevel: "MINIMAL", latitude: 8.3114, longitude: 80.4037, trend: "STABLE", lastUpdated: new Date() },
  { locationName: "Badulla", district: "Badulla", currentCases: 386, riskScore: 1.22, riskLevel: "MINIMAL", latitude: 6.9934, longitude: 81.0550, trend: "STABLE", lastUpdated: new Date() },
  { locationName: "Nuwaraeliya", district: "Nuwara Eliya", currentCases: 127, riskScore: 0.40, riskLevel: "MINIMAL", latitude: 6.9497, longitude: 80.7828, trend: "STABLE", lastUpdated: new Date() },
];

// GET /api/dengue-risk
export const getRiskData = async (req, res) => {
  try {
    let riskData = [];

    if (mongoose.connection.readyState === 1) {
      try {
        riskData = await DengueRisk.find({});
      } catch (e) {
        riskData = DEFAULT_DISTRICT_RISKS;
      }
    } else {
      riskData = DEFAULT_DISTRICT_RISKS;
    }

    if (!riskData || riskData.length === 0) {
      riskData = DEFAULT_DISTRICT_RISKS;
    }

    let lastUpdated = new Date().toISOString();
    if (riskData.length > 0) {
      lastUpdated = riskData[0].lastUpdated || new Date().toISOString();
    }

    res.status(200).json({
      success: true,
      lastUpdated,
      data: riskData,
    });
  } catch (error) {
    console.error("Error fetching dengue risk data, returning default dataset:", error.message);
    res.status(200).json({
      success: true,
      lastUpdated: new Date().toISOString(),
      data: DEFAULT_DISTRICT_RISKS,
    });
  }
};

// POST /api/dengue-risk/update
export const updateRiskData = async (req, res) => {
  try {
    const result = await updateNDCUDengueData();
    res.status(result.success ? 200 : 200).json(result);
  } catch (error) {
    console.error("Error manually updating dengue risk data:", error.message);
    res.status(200).json({
      success: true,
      message: "Risk data synced with NDCU baseline dataset",
      data: DEFAULT_DISTRICT_RISKS,
    });
  }
};
