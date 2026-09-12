import { getWeatherData } from "./weatherService.js";
import { getDengueHistoryScore } from "./dengueHistoryService.js";
import { getReportDensityScore } from "./densityService.js";

/**
 * Multi-Factor Risk Scoring Engine
 * Strictly follows the university project proposal (Pages 5, 8, 9, 12).
 *
 * Formula:
 *   Total Score = (0.40 * AI_Score) + (0.20 * Weather_Score) + (0.25 * History_Score) + (0.15 * Density_Score)
 *
 * Classification:
 *   - 0 to 39:   Low Risk    / Priority: Low
 *   - 40 to 69:  Medium Risk / Priority: Moderate
 *   - 70 to 100: High Risk   / Priority: Immediate Inspection
 */

const OBJECT_WEIGHTS = {
  Tire: 40,
  "Drain-Inlet": 30,
  Vase: 20,
  "Coconut-Exocarp": 15,
  Bottle: 10,
};

/**
 * Calculates raw AI detection risk score (0 - 100) from YOLO predictions
 */
export function calculateAiScore(predictions = []) {
  if (!predictions || predictions.length === 0) {
    return 15; // baseline when no objects detected
  }

  let totalWeight = 0;
  for (const pred of predictions) {
    const cls = pred.class || pred.label;
    const conf = (pred.confidence !== undefined ? pred.confidence : (pred.conf || 0) / 100);
    const weight = OBJECT_WEIGHTS[cls] || 10;
    totalWeight += (weight * conf);
  }

  // Multiply if multiple breeding sites found in single frame
  if (predictions.length > 1) {
    totalWeight *= 1.25;
  }

  // Scale to 0 - 100
  const normalizedScore = Math.min(100, Math.round((totalWeight / 40) * 100));
  return Math.max(10, normalizedScore);
}

/**
 * Computes complete 4-factor risk assessment
 */
export async function calculateCompositeRisk({
  predictions = [],
  lat = null,
  lng = null,
  district = "",
  location = "",
}) {
  // 1. AI Detection Factor (40%)
  const aiScore = calculateAiScore(predictions);

  // 2. Weather & Rainfall Factor (20%)
  const weatherData = await getWeatherData({ lat, lng, locationName: district || location });
  const weatherScore = weatherData.weatherScore;

  // 3. Historical Dengue Cases Factor (25%)
  const historyData = getDengueHistoryScore({ district, location, lat, lng });
  const historyScore = historyData.historyScore;

  // 4. Report Density Factor (15%)
  const densityData = getReportDensityScore({ lat, lng, location });
  const densityScore = densityData.densityScore;

  // Weighted sum calculation
  const totalScore = Math.round(
    0.40 * aiScore +
    0.20 * weatherScore +
    0.25 * historyScore +
    0.15 * densityScore
  );

  // Risk & Priority Categorization
  let riskLevel = "Low";
  let priority = "Low";
  let recommendedAction = "Routine monitoring";

  if (totalScore >= 70) {
    riskLevel = "High";
    priority = "Immediate Inspection";
    recommendedAction = "Immediate PHI field inspection & larvicide / source elimination required";
  } else if (totalScore >= 40) {
    riskLevel = "Medium";
    priority = "Moderate";
    recommendedAction = "Scheduled inspection within 48-72 hours";
  } else {
    riskLevel = "Low";
    priority = "Low";
    recommendedAction = "Community awareness & periodic follow-up";
  }

  return {
    riskScore: totalScore,
    riskLevel,
    priority,
    recommendedAction,
    breakdown: {
      ai: {
        weight: "40%",
        score: aiScore,
        weightedContribution: Math.round(0.40 * aiScore * 10) / 10,
        detectedCount: predictions.length,
      },
      weather: {
        weight: "20%",
        score: weatherScore,
        weightedContribution: Math.round(0.20 * weatherScore * 10) / 10,
        details: weatherData,
      },
      history: {
        weight: "25%",
        score: historyScore,
        weightedContribution: Math.round(0.25 * historyScore * 10) / 10,
        details: historyData,
      },
      density: {
        weight: "15%",
        score: densityScore,
        weightedContribution: Math.round(0.15 * densityScore * 10) / 10,
        details: densityData,
      },
    },
  };
}
