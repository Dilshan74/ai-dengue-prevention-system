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

export const reverseGeocode = asyncHandler(async (req, res) => {
  const { lat, lng } = req.query;
  if (!lat || !lng) {
    return res.status(400).json({ message: "lat and lng query parameters are required" });
  }

  const nLat = Number(lat);
  const nLng = Number(lng);

  try {
    const osmUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${nLat}&lon=${nLng}&zoom=16&addressdetails=1`;
    const response = await fetch(osmUrl, {
      headers: { "User-Agent": "DengueGuard-KDU-AI-System/1.0" },
      signal: AbortSignal.timeout(3500),
    });

    if (response.ok) {
      const data = await response.json();
      const addr = data.address || {};
      const suburb = addr.suburb || addr.neighbourhood || addr.city_district || addr.town || addr.village || "";
      const city = addr.city || addr.county || addr.state_district || "Colombo";
      const state = addr.state || "Western Province";
      const formatted = [suburb, city, state].filter(Boolean).join(", ") || data.display_name;

      return res.json({
        lat: nLat,
        lng: nLng,
        address: formatted,
        suburb,
        city,
        state,
        district: city,
        formatted: data.display_name,
      });
    }
  } catch (err) {
    console.warn("Reverse geocode fetch failed, using fallback:", err.message);
  }

  // Fallback Sri Lanka district mapping by approximate coordinates
  let estimatedDistrict = "Colombo";
  if (nLat > 9.0) estimatedDistrict = "Jaffna";
  else if (nLat > 7.8 && nLng > 81.0) estimatedDistrict = "Trincomalee / Batticaloa";
  else if (nLat > 7.8) estimatedDistrict = "Anuradhapura";
  else if (nLat > 7.2 && nLng > 80.5) estimatedDistrict = "Kandy";
  else if (nLat > 7.0 && nLng < 80.1) estimatedDistrict = "Gampaha";
  else if (nLat < 6.2) estimatedDistrict = "Galle / Matara";
  else if (nLng > 80.3) estimatedDistrict = "Ratnapura";

  res.json({
    lat: nLat,
    lng: nLng,
    address: `${estimatedDistrict}, Sri Lanka`,
    district: estimatedDistrict,
    formatted: `GPS Location (${nLat.toFixed(4)}° N, ${nLng.toFixed(4)}° E), ${estimatedDistrict}`,
  });
});
