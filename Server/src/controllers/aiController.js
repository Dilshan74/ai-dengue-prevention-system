import axios from "axios";
import { env } from "../config/env.js";
import { predictionsStore, reportsStore } from "../data/stores.js";
import { asyncHandler, nextId, ApiError } from "../utils/helpers.js";
import { classifyImage } from "../utils/aiSimulator.js";
import { uploadUrl } from "../middleware/upload.js";

function getDistrictProfile(location = "") {
  const loc = (location || "").toLowerCase();
  if (loc.includes("colombo") || loc.includes("nugegoda") || loc.includes("dehiwala") || loc.includes("moratuwa") || loc.includes("kotte")) {
    return { rainfall_mm: 125.0, ndcu_cases: 980, report_density: 8, district: "Colombo" };
  }
  if (loc.includes("gampaha") || loc.includes("kelaniya") || loc.includes("negombo") || loc.includes("ragama")) {
    return { rainfall_mm: 110.0, ndcu_cases: 750, report_density: 6, district: "Gampaha" };
  }
  if (loc.includes("kalutara") || loc.includes("panadura") || loc.includes("horana")) {
    return { rainfall_mm: 135.0, ndcu_cases: 480, report_density: 4, district: "Kalutara" };
  }
  if (loc.includes("kandy") || loc.includes("peradeniya")) {
    return { rainfall_mm: 95.0, ndcu_cases: 420, report_density: 5, district: "Kandy" };
  }
  if (loc.includes("galle") || loc.includes("karapitiya")) {
    return { rainfall_mm: 88.0, ndcu_cases: 310, report_density: 3, district: "Galle" };
  }
  return { rainfall_mm: 65.0, ndcu_cases: 350, report_density: 3, district: "Western Province" };
}

async function getAiPrediction(file, meta = {}) {
  const profile = getDistrictProfile(meta.location);
  const rainfall = meta.rainfall_mm !== undefined && meta.rainfall_mm !== "" ? Number(meta.rainfall_mm) : profile.rainfall_mm;
  const cases = meta.ndcu_cases !== undefined && meta.ndcu_cases !== "" ? Number(meta.ndcu_cases) : profile.ndcu_cases;
  const density = meta.report_density !== undefined && meta.report_density !== "" ? Number(meta.report_density) : profile.report_density;

  try {
    const params = new URLSearchParams();
    params.append("image_path", file.path);
    params.append("rainfall_mm", String(rainfall));
    params.append("ndcu_cases", String(cases));
    params.append("report_density", String(density));

    const response = await axios.post(`${env.aiServiceUrl}/predict`, params, {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      timeout: 15000,
    });

    if (response.data) {
      return {
        ...response.data,
        source: "YOLOv8 + Random Forest (FastAPI)",
        districtContext: profile.district,
      };
    }
  } catch (error) {
    console.warn(`[AI Controller] AI service at ${env.aiServiceUrl} unavailable (${error.message}). Using fallback simulator.`);
  }

  // Graceful fallback to simulator if Python service is offline
  const sim = classifyImage();
  return {
    ...sim,
    rfRiskScore: sim.risk === "High" ? 82.5 : sim.risk === "Medium" ? 58.0 : 25.0,
    rfRiskLevel: sim.risk,
    riskFactors: {
      aiSeverity: sim.risk === "High" ? 90.0 : sim.risk === "Medium" ? 65.0 : 0.0,
      aiConfidence: sim.confidence,
      rainfallMm: rainfall,
      ndcuCases: cases,
      reportDensity: density,
    },
    source: "Simulator Fallback",
    districtContext: profile.district,
  };
}

export const predict = asyncHandler(async (req, res) => {
  if (!req.file) throw new ApiError(400, "An image is required");

  const meta = {
    location: req.body.location,
    rainfall_mm: req.body.rainfall_mm,
    ndcu_cases: req.body.ndcu_cases,
    report_density: req.body.report_density,
  };

  const result = await getAiPrediction(req.file, meta);
  const prediction = {
    id: nextId("PRED"),
    reportId: req.body.reportId || null,
    image: uploadUrl(req.file.filename),
    location: req.body.location || "Nugegoda, Ward 12",
    ...result,
    createdAt: new Date().toISOString(),
    feedback: null,
  };
  predictionsStore.insert(prediction);

  // If this prediction is tied to a report, sync the report's risk level.
  if (prediction.reportId) {
    reportsStore.update((r) => r.id === prediction.reportId, { risk: result.risk });
  }

  res.json(prediction);
});

export const getPrediction = asyncHandler(async (req, res) => {
  const prediction = predictionsStore.find((p) => p.reportId === req.params.reportId);
  if (!prediction) throw new ApiError(404, "No prediction found for this report");
  res.json(prediction);
});

export const accuracy = asyncHandler(async (req, res) => {
  const predictions = predictionsStore.all();
  const withFeedback = predictions.filter((p) => p.feedback);
  const correct = withFeedback.filter((p) => p.feedback.correct).length;

  const trend = [
    { m: "Jan", acc: 88.2 },
    { m: "Feb", acc: 89.1 },
    { m: "Mar", acc: 90.6 },
    { m: "Apr", acc: 91.3 },
    { m: "May", acc: 92.0 },
    { m: "Jun", acc: 92.8 },
    { m: "Jul", acc: 93.4 },
  ];

  res.json({
    overallAccuracy: withFeedback.length ? Math.round((correct / withFeedback.length) * 1000) / 10 : 93.4,
    totalPredictions: predictions.length,
    feedbackCount: withFeedback.length,
    trend,
    confidenceDistribution: [
      { r: "0-20%", n: 3 },
      { r: "20-40%", n: 8 },
      { r: "40-60%", n: 22 },
      { r: "60-80%", n: 41 },
      { r: "80-100%", n: 126 },
    ],
  });
});

export const feedback = asyncHandler(async (req, res) => {
  const prediction = predictionsStore.find((p) => p.reportId === req.params.reportId);
  if (!prediction) throw new ApiError(404, "No prediction found for this report");

  const updated = predictionsStore.update(
    (p) => p.id === prediction.id,
    { feedback: { ...req.body, submittedAt: new Date().toISOString() } },
  );

  res.json(updated);
});
