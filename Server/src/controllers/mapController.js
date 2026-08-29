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
 * Full report data for map markers. Supports optional risk / status filters.
 * GET /api/map/reports?risk=High&status=Pending
 */
export const mapReports = asyncHandler(async (req, res) => {
  const { risk, status } = req.query;

  const query = { lat: { $ne: null }, lng: { $ne: null } };
  if (risk) query.risk = risk;
  if (status) query.status = status;

  const reports = await Report.find(query)
    .sort({ date: -1 })
    .lean();

  const items = reports.map((r) => ({
    id: r.id,
    description: r.description,
    location: r.location,
    address: r.address,
    lat: r.lat,
    lng: r.lng,
    risk: r.risk,
    status: r.status,
    date: r.date,
    citizenName: r.citizenName,
    phi: r.phi,
    phiId: r.phiId,
  }));

  res.json(items);
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
