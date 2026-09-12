import { reportsStore } from "../data/stores.js";

/**
 * Density Service
 * Computes the density of existing mosquito breeding site complaints in the vicinity.
 * Proposal weight: 15%
 */

// Haversine distance in kilometers
function getDistanceKm(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return null;
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function getReportDensityScore({ lat, lng, location = "" }) {
  const allReports = reportsStore.all() || [];
  
  let nearbyCount = 0;
  const RADIUS_KM = 3.0; // 3km neighbourhood radius

  if (lat && lng) {
    nearbyCount = allReports.filter((r) => {
      if (r.lat && r.lng) {
        const dist = getDistanceKm(lat, lng, r.lat, r.lng);
        return dist !== null && dist <= RADIUS_KM;
      }
      return false;
    }).length;
  } else if (location) {
    const locLower = location.toLowerCase();
    nearbyCount = allReports.filter((r) => 
      r.location && r.location.toLowerCase().includes(locLower)
    ).length;
  }

  // Calculate score (0 - 100) based on density count
  let densityScore = 20; // baseline for isolated report
  if (nearbyCount >= 6) {
    densityScore = 95;
  } else if (nearbyCount >= 4) {
    densityScore = 80;
  } else if (nearbyCount >= 2) {
    densityScore = 60;
  } else if (nearbyCount === 1) {
    densityScore = 40;
  }

  return {
    nearbyReportsCount: nearbyCount,
    radiusKm: RADIUS_KM,
    densityScore,
  };
}
