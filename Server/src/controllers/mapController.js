import Area from "../models/area.js";
import Report from "../models/report.js";
import { asyncHandler } from "../utils/helpers.js";

export const riskAreas = asyncHandler(async (req, res) => {
  const areas = await Area.find().lean();
  res.json(areas);
});

export const heatmap = asyncHandler(async (req, res) => {
  const reports = await Report.find({ lat: { $ne: null }, lng: { $ne: null } }).lean();
  const points = reports.map((r) => ({
    lat: r.lat,
    lng: r.lng,
    weight: r.risk === "High" ? 3 : r.risk === "Medium" ? 2 : 1,
  }));
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
