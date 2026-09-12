import { calculateAiScore, calculateCompositeRisk } from "../services/riskScoringService.js";
import { calculateWeatherScore } from "../services/weatherService.js";
import { getDengueHistoryScore } from "../services/dengueHistoryService.js";

async function runTests() {
  console.log("=================================================");
  console.log("🧪 PHASE 1: MULTI-FACTOR RISK SCORING ENGINE TESTS");
  console.log("=================================================\n");

  let passed = 0;
  let total = 0;

  function assert(condition, name, details = "") {
    total++;
    if (condition) {
      console.log(`✅ [PASS] ${name}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${name} -> ${details}`);
    }
  }

  // 1. Test AI Detection Scoring
  console.log("--- 1. Testing AI Detection Component (40% Weight) ---");
  const tireDetection = [{ class: "Tire", confidence: 0.95 }];
  const tireScore = calculateAiScore(tireDetection);
  assert(tireScore >= 90, "Tire high confidence produces high AI score", `Score: ${tireScore}`);

  const bottleDetection = [{ class: "Bottle", confidence: 0.60 }];
  const bottleScore = calculateAiScore(bottleDetection);
  assert(bottleScore < tireScore, "Bottle produces lower AI score than Tire", `Bottle: ${bottleScore}, Tire: ${tireScore}`);

  const multipleDetections = [
    { class: "Tire", confidence: 0.90 },
    { class: "Drain-Inlet", confidence: 0.85 },
  ];
  const multiScore = calculateAiScore(multipleDetections);
  assert(multiScore === 100, "Multiple breeding objects scale up AI score to max (100)", `MultiScore: ${multiScore}`);

  // 2. Test Weather Scoring
  console.log("\n--- 2. Testing Weather Component (20% Weight) ---");
  const rainyScore = calculateWeatherScore(25, 88, 29, "Heavy Rain");
  const dryScore = calculateWeatherScore(0, 45, 36, "Sunny / Dry");
  assert(rainyScore >= 80, "Heavy rain & optimal temp yields high weather risk score", `Rainy score: ${rainyScore}`);
  assert(dryScore <= 40, "Dry & hot conditions yield low weather risk score", `Dry score: ${dryScore}`);

  // 3. Test Historical Dengue Hotspot Index
  console.log("\n--- 3. Testing Historical Dengue Component (25% Weight) ---");
  const colomboHist = getDengueHistoryScore({ district: "Colombo" });
  const nuwaraHist = getDengueHistoryScore({ district: "Nuwara Eliya" });
  assert(colomboHist.historyScore >= 85, "Colombo has High Risk historical score", `Score: ${colomboHist.historyScore}`);
  assert(nuwaraHist.historyScore <= 30, "Nuwara Eliya has Low Risk historical score", `Score: ${nuwaraHist.historyScore}`);

  // 4. Test Composite Risk Formula & Priority Classification
  console.log("\n--- 4. Testing Composite Multi-Factor Risk Calculation ---");

  // Scenario A: High Risk
  const highRiskResult = await calculateCompositeRisk({
    predictions: [{ class: "Tire", confidence: 0.95 }],
    district: "Colombo",
    location: "Colombo 07",
    lat: 6.9271,
    lng: 79.8612,
  });
  console.log("Scenario A (High Risk):", {
    riskScore: highRiskResult.riskScore,
    riskLevel: highRiskResult.riskLevel,
    priority: highRiskResult.priority,
    breakdown: highRiskResult.breakdown,
  });
  assert(highRiskResult.riskScore >= 70, "High Risk Scenario has Risk Score >= 70", `Score: ${highRiskResult.riskScore}`);
  assert(highRiskResult.riskLevel === "High", "High Risk Scenario categorized as 'High'", `Level: ${highRiskResult.riskLevel}`);
  assert(highRiskResult.priority === "Immediate Inspection", "High Risk Priority is 'Immediate Inspection'", `Priority: ${highRiskResult.priority}`);

  // Scenario B: Low Risk
  const lowRiskResult = await calculateCompositeRisk({
    predictions: [{ class: "Bottle", confidence: 0.30 }],
    district: "Nuwara Eliya",
    location: "Nuwara Eliya Town",
    lat: 6.9497,
    lng: 80.7891,
  });
  console.log("\nScenario B (Low Risk):", {
    riskScore: lowRiskResult.riskScore,
    riskLevel: lowRiskResult.riskLevel,
    priority: lowRiskResult.priority,
  });
  assert(lowRiskResult.riskScore < 40, "Low Risk Scenario has Risk Score < 40", `Score: ${lowRiskResult.riskScore}`);
  assert(lowRiskResult.riskLevel === "Low", "Low Risk Scenario categorized as 'Low'", `Level: ${lowRiskResult.riskLevel}`);
  assert(lowRiskResult.priority === "Low", "Low Risk Priority is 'Low'", `Priority: ${lowRiskResult.priority}`);

  console.log("\n=================================================");
  console.log(`🏁 TEST SUMMARY: ${passed}/${total} tests passed (${Math.round((passed/total)*100)}%)`);
  console.log("=================================================\n");

  if (passed === total) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error("Test runner error:", err);
  process.exit(1);
});
