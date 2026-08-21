import { predictionsStore, reportsStore } from "../data/stores.js";
import { asyncHandler, nextId, ApiError } from "../utils/helpers.js";
import { classifyImage } from "../utils/aiSimulator.js";
import { uploadUrl } from "../middleware/upload.js";

export const predict = asyncHandler(async (req, res) => {
  if (!req.file) throw new ApiError(400, "An image is required");

  const result = classifyImage();
  const prediction = {
    id: nextId("PRED"),
    reportId: req.body.reportId || null,
    image: uploadUrl(req.file.filename),
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
