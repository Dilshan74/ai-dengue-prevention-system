import Report from "../models/report.js";
import User from "../models/user.js";
import DengueRisk from "../models/dengueRisk.js";
import { asyncHandler, nextReportId, paginate, ApiError } from "../utils/helpers.js";
import { uploadUrl } from "../middleware/upload.js";

export const dashboard = asyncHandler(async (req, res) => {
  const myReports = await Report.find({ citizenId: req.user.id }).lean();

  const stats = {
    totalReports: myReports.length,
    pending: myReports.filter((r) => r.status === "Pending").length,
    resolved: myReports.filter((r) => r.status === "Resolved").length,
    highRisk: myReports.filter((r) => r.risk === "High").length,
  };

  const recentReports = [...myReports]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 5);

  let userArea = req.user.area;
  
  if (!userArea && req.user.address) {
    const knownDistricts = [
      "Colombo", "Gampaha", "Kalutara", "Kandy", "Matale", "Nuwara Eliya", 
      "Galle", "Matara", "Hambantota", "Jaffna", "Kilinochchi", "Mannar", 
      "Vavuniya", "Mullaitivu", "Batticaloa", "Ampara", "Trincomalee", 
      "Kurunegala", "Puttalam", "Anuradhapura", "Polonnaruwa", "Badulla", 
      "Monaragala", "Ratnapura", "Kegalle"
    ];
    const addr = req.user.address.toLowerCase();
    userArea = knownDistricts.find(d => addr.includes(d.toLowerCase()));
  }
  
  userArea = userArea || "Colombo";
  
  let areaRisk = await DengueRisk.findOne({ locationName: userArea }).lean();
  
  if (!areaRisk) {
    areaRisk = await DengueRisk.findOne({ locationName: "Colombo" }).lean(); // fallback
  }

  res.json({
    stats,
    recentReports,
    areaRisk,
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

  const query = { citizenId: req.user.id };
  if (status) query.status = status;

  let items = await Report.find(query).sort({ date: -1 }).lean();

  if (search) {
    const q = String(search).toLowerCase();
    items = items.filter(
      (r) =>
        r.id.toLowerCase().includes(q) ||
        r.location.toLowerCase().includes(q) ||
        r.description?.toLowerCase().includes(q),
    );
  }

  res.json(paginate(items, { page, pageSize }));
});

export const getComplaint = asyncHandler(async (req, res) => {
  const report = await Report.findOne({ id: req.params.id, citizenId: req.user.id }).lean();
  if (!report) throw new ApiError(404, "Report not found");
  res.json(report);
});

export const createComplaint = asyncHandler(async (req, res) => {
  const { description, location, address, lat, lng, image: rawImage, risk, riskScore, priority, predictions, category } = req.body;
  if (!description || !location) {
    throw new ApiError(400, "Description and location are required");
  }

  const uploadedFiles = (req.files || []).map((f) => uploadUrl(f.filename));
  const finalImage = uploadedFiles[0] || rawImage || "🪣";

  const report = await Report.create({
    id: nextReportId(),
    citizenId: req.user.id,
    citizenName: req.user.name,
    description,
    location,
    address: address || location,
    lat: lat ? Number(lat) : null,
    lng: lng ? Number(lng) : null,
    category: category || "container",
    image: finalImage,
    images: uploadedFiles.length > 0 ? uploadedFiles : (rawImage ? [rawImage] : []),
    status: "Pending",
    risk: risk || "Medium",
    riskScore: riskScore ? Number(riskScore) : (risk === "High" ? 85 : risk === "Medium" ? 55 : 25),
    priority: priority || (risk === "High" ? "Immediate Inspection" : risk === "Medium" ? "Moderate" : "Low"),
    predictions: predictions || [],
    phi: "—",
    phiId: null,
    date: new Date(),
    updated: new Date(),
    comments: [],
    history: [{ status: "Pending", date: new Date(), comments: "Report submitted & queued for PHI review" }],
  });

  res.status(201).json(report.toObject ? report.toObject() : report);
});

export const profile = asyncHandler(async (req, res) => {
  const { passwordHash, ...rest } = req.user; // eslint-disable-line no-unused-vars
  res.json(rest);
});

export const updateProfile = asyncHandler(async (req, res) => {
  const { name, mobile, address, email, nic } = req.body;
  const patch = {};
  if (name) patch.name = name;
  if (mobile) patch.mobile = mobile;
  if (address) patch.address = address;
  if (email) patch.email = email;
  if (nic) patch.nic = nic;

  const updated = await User.findOneAndUpdate({ id: req.user.id }, patch, { new: true }).lean();
  const { passwordHash, ...rest } = updated; // eslint-disable-line no-unused-vars
  res.json(rest);
});

export const updateSettings = asyncHandler(async (req, res) => {
  const updated = await User.findOneAndUpdate(
    { id: req.user.id },
    { settings: { ...(req.user.settings || {}), ...req.body } },
    { new: true }
  ).lean();
  res.json(updated.settings);
});
