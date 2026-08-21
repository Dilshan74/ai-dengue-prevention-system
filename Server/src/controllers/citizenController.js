import { reportsStore, usersStore } from "../data/stores.js";
import { asyncHandler, nextReportId, paginate, ApiError } from "../utils/helpers.js";
import { uploadUrl } from "../middleware/upload.js";

export const dashboard = asyncHandler(async (req, res) => {
  const myReports = reportsStore.filter((r) => r.citizenId === req.user.id);

  const stats = {
    totalReports: myReports.length,
    pending: myReports.filter((r) => r.status === "Pending").length,
    resolved: myReports.filter((r) => r.status === "Resolved").length,
    highRisk: myReports.filter((r) => r.risk === "High").length,
  };

  const recentReports = [...myReports]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 5);

  res.json({
    stats,
    recentReports,
    weather: { city: "Colombo", temp: 29, condition: "Thunderstorms", humidity: 82, rain: 68 },
    tips: [
      "Empty water containers, buckets, and flower pots weekly.",
      "Cover water storage tanks and wells tightly.",
      "Clean roof gutters and drains regularly.",
      "Use mosquito repellents and wear long sleeves at dusk.",
      "Report stagnant water in your neighborhood immediately.",
    ],
  });
});

export const listComplaints = asyncHandler(async (req, res) => {
  const { status, search, page = 1, pageSize = 10 } = req.query;

  let items = reportsStore.filter((r) => r.citizenId === req.user.id);
  if (status) items = items.filter((r) => r.status === status);
  if (search) {
    const q = String(search).toLowerCase();
    items = items.filter(
      (r) =>
        r.id.toLowerCase().includes(q) ||
        r.location.toLowerCase().includes(q) ||
        r.description?.toLowerCase().includes(q),
    );
  }
  items = [...items].sort((a, b) => new Date(b.date) - new Date(a.date));

  res.json(paginate(items, { page, pageSize }));
});

export const getComplaint = asyncHandler(async (req, res) => {
  const report = reportsStore.find((r) => r.id === req.params.id && r.citizenId === req.user.id);
  if (!report) throw new ApiError(404, "Report not found");
  res.json(report);
});

export const createComplaint = asyncHandler(async (req, res) => {
  const { description, location, address, lat, lng } = req.body;
  if (!description || !location) {
    throw new ApiError(400, "Description and location are required");
  }

  const images = (req.files || []).map((f) => uploadUrl(f.filename));

  const report = {
    id: nextReportId(),
    citizenId: req.user.id,
    citizenName: req.user.name,
    description,
    location,
    address: address || location,
    lat: lat ? Number(lat) : null,
    lng: lng ? Number(lng) : null,
    image: images[0] || "🪣",
    images,
    status: "Pending",
    risk: "Medium",
    phi: "—",
    phiId: null,
    date: new Date().toISOString().slice(0, 10),
    updated: new Date().toISOString(),
    comments: [],
    history: [{ status: "Pending", date: new Date().toISOString(), comments: "Report submitted" }],
  };

  reportsStore.insert(report);
  res.status(201).json(report);
});

export const profile = asyncHandler(async (req, res) => {
  const { passwordHash, ...rest } = req.user; // eslint-disable-line no-unused-vars
  res.json(rest);
});

export const updateProfile = asyncHandler(async (req, res) => {
  const { name, mobile, address } = req.body;
  const updated = usersStore.update((u) => u.id === req.user.id, {
    ...(name && { name }),
    ...(mobile && { mobile }),
    ...(address && { address }),
  });
  const { passwordHash, ...rest } = updated; // eslint-disable-line no-unused-vars
  res.json(rest);
});

export const updateSettings = asyncHandler(async (req, res) => {
  const updated = usersStore.update((u) => u.id === req.user.id, {
    settings: { ...(req.user.settings || {}), ...req.body },
  });
  res.json(updated.settings);
});
