import bcrypt from "bcryptjs";
import User from "../models/user.js";
import Report from "../models/report.js";
import Area from "../models/area.js";
import Setting from "../models/settings.js";
import { asyncHandler, paginate, nextId, ApiError } from "../utils/helpers.js";

function publicUser(user) {
  const { passwordHash, ...rest } = user; // eslint-disable-line no-unused-vars
  return rest;
}

export const dashboard = asyncHandler(async (req, res) => {
  const [totalUsers, totalPhis, totalReports, highRiskReports, resolvedReports, pendingReports, recentReports] =
    await Promise.all([
      User.countDocuments({ role: "citizen" }),
      User.countDocuments({ role: "phi" }),
      Report.countDocuments(),
      Report.countDocuments({ risk: "High" }),
      Report.countDocuments({ status: "Resolved" }),
      Report.countDocuments({ status: { $in: ["Pending", "Under Review"] } }),
      Report.find().sort({ date: -1 }).limit(8).lean(),
    ]);

  res.json({
    stats: { totalUsers, totalPhis, totalReports, highRiskReports, resolvedReports, pendingReports },
    recentReports,
  });
});

// ---- Users ----

export const listUsers = asyncHandler(async (req, res) => {
  const { role, status, search, page = 1, pageSize = 10 } = req.query;

  const query = { role: role || "citizen" };
  if (status) query.status = status;

  let items = await User.find(query).lean();
  items = items.map(publicUser);

  if (search) {
    const q = String(search).toLowerCase();
    items = items.filter(
      (u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q),
    );
  }

  res.json(paginate(items, { page, pageSize }));
});

export const createUser = asyncHandler(async (req, res) => {
  const { name, email, mobile, address, password, role = "citizen" } = req.body;
  if (!name || !email || !password) throw new ApiError(400, "Name, email and password are required");

  const existing = await User.findOne({ email: String(email).toLowerCase() });
  if (existing) throw new ApiError(409, "A user with this email already exists");

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({
    id: nextId("U"),
    name,
    email: String(email).toLowerCase(),
    mobile: mobile || "",
    address: address || "",
    passwordHash,
    role,
    status: "Active",
    joined: new Date().toISOString().slice(0, 10),
  });

  res.status(201).json(publicUser(user.toObject()));
});

export const updateUser = asyncHandler(async (req, res) => {
  const { password, ...patch } = req.body;
  if (password) patch.passwordHash = await bcrypt.hash(password, 10);

  const updated = await User.findOneAndUpdate({ id: req.params.id }, patch, { new: true }).lean();
  if (!updated) throw new ApiError(404, "User not found");
  res.json(publicUser(updated));
});

export const toggleUserStatus = asyncHandler(async (req, res) => {
  const user = await User.findOne({ id: req.params.id }).lean();
  if (!user) throw new ApiError(404, "User not found");

  const nextStatus = user.status === "Active" ? "Inactive" : "Active";
  const updated = await User.findOneAndUpdate({ id: req.params.id }, { status: nextStatus }, { new: true }).lean();
  res.json(publicUser(updated));
});

export const deleteUser = asyncHandler(async (req, res) => {
  const removed = await User.findOneAndDelete({ id: req.params.id });
  if (!removed) throw new ApiError(404, "User not found");
  res.json({ success: true });
});

// ---- PHIs ----

export const listPhis = asyncHandler(async (req, res) => {
  const phis = await User.find({ role: "phi" }).lean();
  res.json(phis.map(publicUser));
});

// ---- Reports (admin) ----

export const listReports = asyncHandler(async (req, res) => {
  const { status, risk, search, page = 1, pageSize = 10 } = req.query;
  const query = {};
  if (status) query.status = status;
  if (risk) query.risk = risk;

  let items = await Report.find(query).sort({ date: -1 }).lean();

  if (search) {
    const q = String(search).toLowerCase();
    items = items.filter(
      (r) =>
        r.id.toLowerCase().includes(q) ||
        r.location?.toLowerCase().includes(q) ||
        r.citizenName?.toLowerCase().includes(q) ||
        r.description?.toLowerCase().includes(q)
    );
  }

  res.json(paginate(items, { page, pageSize }));
});

export const getReport = asyncHandler(async (req, res) => {
  const report = await Report.findOne({ id: req.params.id }).lean();
  if (!report) throw new ApiError(404, "Report not found");
  res.json(report);
});

export const assignPhiToReport = asyncHandler(async (req, res) => {
  const { phiId, status, comments } = req.body;

  const report = await Report.findOne({ id: req.params.id });
  if (!report) throw new ApiError(404, "Report not found");

  // Resolve the PHI user
  let phiName = "—";
  if (phiId) {
    const phi = await User.findOne({ id: phiId, role: "phi" }).lean();
    if (!phi) throw new ApiError(404, "PHI user not found");
    phiName = phi.name;
  }

  const newStatus = status || (report.status === "Pending" ? "Under Review" : report.status);

  const historyEntry = {
    status: newStatus,
    date: new Date(),
    comments: comments || (phiId ? `Assigned to ${phiName}` : "Status updated by admin"),
  };

  const updated = await Report.findOneAndUpdate(
    { id: req.params.id },
    {
      ...(phiId && { phi: phiName, phiId }),
      status: newStatus,
      updated: new Date(),
      $push: { history: historyEntry },
    },
    { new: true }
  ).lean();

  res.json(updated);
});

export const adminUpdateStatus = asyncHandler(async (req, res) => {
  const { status, comments } = req.body;
  if (!status) throw new ApiError(400, "Status is required");

  const report = await Report.findOne({ id: req.params.id });
  if (!report) throw new ApiError(404, "Report not found");

  const updated = await Report.findOneAndUpdate(
    { id: req.params.id },
    {
      status,
      updated: new Date(),
      $push: { history: { status, date: new Date(), comments: comments || "" } },
    },
    { new: true }
  ).lean();

  res.json(updated);
});

export const createPhi = asyncHandler(async (req, res) => {
  const { name, email, mobile, area, password } = req.body;
  if (!name || !email || !password) throw new ApiError(400, "Name, email and password are required");

  const existing = await User.findOne({ email: String(email).toLowerCase() });
  if (existing) throw new ApiError(409, "A user with this email already exists");

  const passwordHash = await bcrypt.hash(password, 10);
  const phi = await User.create({
    id: nextId("PHI"),
    name,
    email: String(email).toLowerCase(),
    mobile: mobile || "",
    passwordHash,
    role: "phi",
    area: area || "",
    inspections: 0,
    rating: 0,
    status: "Active",
  });

  res.status(201).json(publicUser(phi.toObject()));
});

export const assignArea = asyncHandler(async (req, res) => {
  const { areaId } = req.body;
  const phi = await User.findOne({ id: req.params.phiId, role: "phi" }).lean();
  if (!phi) throw new ApiError(404, "PHI not found");

  const area = await Area.findOne({ id: areaId }).lean();
  if (!area) throw new ApiError(404, "Area not found");

  await Area.findOneAndUpdate({ id: areaId }, { phi: phi.name, phiId: phi.id });
  const updatedPhi = await User.findOneAndUpdate(
    { id: phi.id },
    { area: area.name },
    { new: true }
  ).lean();

  res.json(publicUser(updatedPhi));
});

// ---- Areas ----

export const listAreas = asyncHandler(async (req, res) => {
  const areas = await Area.find().lean();
  res.json(areas);
});

export const createArea = asyncHandler(async (req, res) => {
  const { name, risk = "Medium", phiId, x = 50, y = 50 } = req.body;
  if (!name) throw new ApiError(400, "Area name is required");

  let phi = null;
  if (phiId) phi = await User.findOne({ id: phiId, role: "phi" }).lean();

  const area = await Area.create({
    id: nextId("A"),
    name,
    risk,
    phi: phi?.name || "—",
    phiId: phi?.id || null,
    reports: 0,
    x,
    y,
  });

  res.status(201).json(area.toObject());
});

export const updateArea = asyncHandler(async (req, res) => {
  const updated = await Area.findOneAndUpdate({ id: req.params.id }, req.body, { new: true }).lean();
  if (!updated) throw new ApiError(404, "Area not found");
  res.json(updated);
});

export const deleteArea = asyncHandler(async (req, res) => {
  const removed = await Area.findOneAndDelete({ id: req.params.id });
  if (!removed) throw new ApiError(404, "Area not found");
  res.json({ success: true });
});

// ---- Statistics & Settings ----

export const statistics = asyncHandler(async (req, res) => {
  const reports = await Report.find().lean();

  const byMonth = {};
  reports.forEach((r) => {
    const month = new Date(r.date).toLocaleString("en-US", { month: "short" });
    byMonth[month] = byMonth[month] || { name: month, reports: 0, resolved: 0 };
    byMonth[month].reports += 1;
    if (r.status === "Resolved") byMonth[month].resolved += 1;
  });

  const riskDistribution = ["High", "Medium", "Low"].map((risk) => ({
    name: risk,
    value: reports.filter((r) => r.risk === risk).length,
  }));

  res.json({
    monthly: Object.values(byMonth),
    riskDistribution,
    totalReports: reports.length,
  });
});

export const getSettings = asyncHandler(async (req, res) => {
  let settings = await Setting.findOne({ key: "main" }).lean();
  if (!settings) {
    settings = await Setting.create({ key: "main" });
    settings = settings.toObject();
  }
  res.json(settings);
});

export const updateSettings = asyncHandler(async (req, res) => {
  const updated = await Setting.findOneAndUpdate(
    { key: "main" },
    req.body,
    { new: true, upsert: true }
  ).lean();
  res.json(updated);
});
