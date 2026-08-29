/**
 * Calculates dengue risk level based on current and previous case counts.
 * 
 * Rules:
 * - 0-30   : LOW
 * - 31-60  : MEDIUM
 * - 61-80  : HIGH
 * - 81-100 : CRITICAL
 */

export const calculateRisk = (currentCases, previousCases, casesPer100k = null) => {
  let riskScore = 0;
  let trend = 'STABLE';

  // 1. Determine Trend
  if (currentCases > previousCases && previousCases !== 0) {
    trend = 'INCREASING';
  } else if (currentCases < previousCases) {
    trend = 'DECREASING';
  } else {
    trend = 'STABLE';
  }

  // 2. Base score on cases (This is a simplified rule-based approach for now)
  // To avoid a purely linear scale that spikes to 100 on tiny numbers, we apply some thresholds
  if (currentCases < 50) {
    riskScore += 10;
  } else if (currentCases < 200) {
    riskScore += 30;
  } else if (currentCases < 500) {
    riskScore += 50;
  } else if (currentCases < 1000) {
    riskScore += 70;
  } else {
    riskScore += 90;
  }

  // 3. Adjust based on trend
  if (trend === 'INCREASING') {
    const increaseRatio = (currentCases - previousCases) / previousCases;
    if (increaseRatio > 0.5) riskScore += 15; // 50% increase
    else if (increaseRatio > 0.2) riskScore += 10; // 20% increase
    else riskScore += 5; // slight increase
  } else if (trend === 'DECREASING') {
    riskScore -= 10;
  }

  // Ensure risk score is bounded between 0 and 100
  riskScore = Math.max(0, Math.min(100, Math.floor(riskScore)));

  // 4. Determine Risk Level
  let riskLevel = 'MINIMAL';
  if (riskScore > 80) {
    riskLevel = 'CRITICAL';
  } else if (riskScore > 60) {
    riskLevel = 'HIGH';
  } else if (riskScore > 40) {
    riskLevel = 'MODERATE';
  } else if (riskScore > 20) {
    riskLevel = 'LOW';
  } else {
    riskLevel = 'MINIMAL';
  }

  return {
    riskScore,
    riskLevel,
    trend
  };
};

export default { calculateRisk };
