import { areasStore, reportsStore } from "../data/stores.js";
import { asyncHandler } from "../utils/helpers.js";

export const riskAreas = asyncHandler(async (req, res) => {
  res.json(areasStore.all());
});

export const heatmap = asyncHandler(async (req, res) => {
  const points = reportsStore
    .all()
    .filter((r) => r.lat != null && r.lng != null)
    .map((r) => ({ lat: r.lat, lng: r.lng, weight: r.risk === "High" ? 3 : r.risk === "Medium" ? 2 : 1 }));
  res.json(points);
});

/**
 * Simulated reverse geocode. There's no external maps provider wired up in
 * this demo backend — swap this for a real provider (Google/Mapbox/OSM) by
 * calling out to their API here.
 */
export const reverseGeocode = asyncHandler(async (req, res) => {
  const { lat, lng } = req.query;
  res.json({
    lat: Number(lat),
    lng: Number(lng),
    address: `Near ${Number(lat).toFixed(3)}, ${Number(lng).toFixed(3)}`,
    formatted: "Address lookup requires a maps provider API key (not configured in this demo).",
  });
});
