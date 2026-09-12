import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import User from "../models/user.js";
import Report from "../models/report.js";
import Area from "../models/area.js";
import Setting from "../models/settings.js";
import { usersStore, reportsStore, areasStore, settingsStore } from "../data/stores.js";
import { asyncHandler, paginate, nextId, ApiError } from "../utils/helpers.js";

function publicUser(user) {
  const { passwordHash, ...rest } = user; // eslint-disable-line no-unused-vars
  return rest;
}

export const dashboard = asyncHandler(async (req, res) => {
  if (mongoose.connection.readyState === 1) {
    try {
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

      return res.json({
        stats: { totalUsers, totalPhis, totalReports, highRiskReports, resolvedReports, pendingReports },
        recentReports,
      });
    } catch (e) {
      // fallback below
    }
  }

  const allReports = reportsStore.all();
  const allUsers = usersStore.all();

  res.json({
    stats: {
      totalUsers: allUsers.filter((u) => u.role === "citizen").length,
      totalPhis: allUsers.filter((u) => u.role === "phi").length,
      totalReports: allReports.length,
      highRiskReports: allReports.filter((r) => r.risk === "High").length,
      resolvedReports: allReports.filter((r) => r.status === "Resolved").length,
      pendingReports: allReports.filter((r) => r.status === "Pending" || r.status === "Under Review").length,
    },
    recentReports: [...allReports].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 8),
  });
});

// ---- Users ----

export const listUsers = asyncHandler(async (req, res) => {
  const { role, status, search, page = 1, pageSize = 10 } = req.query;

  let items = [];
  if (mongoose.connection.readyState === 1) {
    try {
      const query = { role: role || "citizen" };
      if (status) query.status = status;
      items = await User.find(query).lean();
      items = items.map(publicUser);
    } catch (e) {
      items = usersStore.filter((u) => u.role === (role || "citizen")).map(publicUser);
      if (status) items = items.filter((u) => u.status === status);
    }
  } else {
    items = usersStore.filter((u) => u.role === (role || "citizen")).map(publicUser);
    if (status) items = items.filter((u) => u.status === status);
  }

  if (search) {
    const q = String(search).toLowerCase();
    items = items.filter(
      (u) => u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q),
    );
  }

  res.json(paginate(items, { page, pageSize }));
});

export const createUser = asyncHandler(async (req, res) => {
  const { name, email, mobile, address, password, role = "citizen" } = req.body;
  if (!name || !email || !password) throw new ApiError(400, "Name, email and password are required");

  const emailLower = String(email).toLowerCase();
  const passwordHash = await bcrypt.hash(password, 10);
  const newUser = {
    id: nextId("U"),
    name,
    email: emailLower,
    mobile: mobile || "",
    address: address || "",
    passwordHash,
    role,
    status: "Active",
    joined: new Date().toISOString().slice(0, 10),
  };

  if (mongoose.connection.readyState === 1) {
    try {
      const existing = await User.findOne({ email: emailLower });
      if (existing) throw new ApiError(409, "A user with this email already exists");

      const user = await User.create(newUser);
      return res.status(201).json(publicUser(user.toObject()));
    } catch (e) {
      if (e.statusCode) throw e;
    }
  }

  const existing = usersStore.find((u) => u.email.toLowerCase() === emailLower);
  if (existing) throw new ApiError(409, "A user with this email already exists");

  usersStore.insert(newUser);
  res.status(201).json(publicUser(newUser));
});

export const updateUser = asyncHandler(async (req, res) => {
  const { password, ...patch } = req.body;
  if (password) patch.passwordHash = await bcrypt.hash(password, 10);

  let updated = null;
  if (mongoose.connection.readyState === 1) {
    try {
      updated = await User.findOneAndUpdate({ id: req.params.id }, patch, { new: true }).lean();
    } catch (e) {
      updated = usersStore.update((u) => u.id === req.params.id, patch);
    }
  } else {
    updated = usersStore.update((u) => u.id === req.params.id, patch);
  }

  if (!updated) throw new ApiError(404, "User not found");
  res.json(publicUser(updated));
});

export const toggleUserStatus = asyncHandler(async (req, res) => {
  let user = null;
  if (mongoose.connection.readyState === 1) {
    try {
      user = await User.findOne({ id: req.params.id }).lean();
      if (!user) throw new ApiError(404, "User not found");

      const nextStatus = user.status === "Active" ? "Inactive" : "Active";
      const updated = await User.findOneAndUpdate({ id: req.params.id }, { status: nextStatus }, { new: true }).lean();
      return res.json(publicUser(updated));
    } catch (e) {
      if (e.statusCode) throw e;
    }
  }

  user = usersStore.find((u) => u.id === req.params.id);
  if (!user) throw new ApiError(404, "User not found");

  const nextStatus = user.status === "Active" ? "Inactive" : "Active";
  const updated = usersStore.update((u) => u.id === req.params.id, { status: nextStatus });
  res.json(publicUser(updated));
});

export const deleteUser = asyncHandler(async (req, res) => {
  if (mongoose.connection.readyState === 1) {
    try {
      const removed = await User.findOneAndDelete({ id: req.params.id });
      if (!removed) throw new ApiError(404, "User not found");
      return res.json({ success: true });
    } catch (e) {
      if (e.statusCode) throw e;
    }
  }

  usersStore.remove((u) => u.id === req.params.id);
  res.json({ success: true });
});

// ---- PHIs ----

export const listPhis = asyncHandler(async (req, res) => {
  let phis = [];
  if (mongoose.connection.readyState === 1) {
    try {
      phis = await User.find({ role: "phi" }).lean();
      return res.json(phis.map(publicUser));
    } catch (e) {
      phis = usersStore.filter((u) => u.role === "phi");
    }
  } else {
    phis = usersStore.filter((u) => u.role === "phi");
  }

  res.json(phis.map(publicUser));
});

// ---- Reports (admin) ----

export const listReports = asyncHandler(async (req, res) => {
  const { status, risk, search, page = 1, pageSize = 10 } = req.query;

  let items = [];
  if (mongoose.connection.readyState === 1) {
    try {
      const query = {};
      if (status) query.status = status;
      if (risk) query.risk = risk;
      items = await Report.find(query).sort({ date: -1 }).lean();
    } catch (e) {
      items = reportsStore.all();
      if (status) items = items.filter((r) => r.status === status);
      if (risk) items = items.filter((r) => r.risk === risk);
    }
  } else {
    items = reportsStore.all();
    if (status) items = items.filter((r) => r.status === status);
    if (risk) items = items.filter((r) => r.risk === risk);
  }

  if (search) {
    const q = String(search).toLowerCase();
    items = items.filter(
      (r) =>
        r.id?.toLowerCase().includes(q) ||
        r.location?.toLowerCase().includes(q) ||
        r.citizenName?.toLowerCase().includes(q) ||
        r.description?.toLowerCase().includes(q)
    );
  }

  res.json(paginate(items, { page, pageSize }));
});

export const getReport = asyncHandler(async (req, res) => {
  let report = null;
  if (mongoose.connection.readyState === 1) {
    try {
      report = await Report.findOne({ id: req.params.id }).lean();
    } catch (e) {
      report = reportsStore.find((r) => r.id === req.params.id);
    }
  } else {
    report = reportsStore.find((r) => r.id === req.params.id);
  }

  if (!report) throw new ApiError(404, "Report not found");
  res.json(report);
});

export const assignPhiToReport = asyncHandler(async (req, res) => {
  const { phiId, status, comments } = req.body;

  let phiName = "—";
  if (phiId) {
    const phi = usersStore.find((u) => u.id === phiId && u.role === "phi");
    if (phi) phiName = phi.name;
  }

  const report = reportsStore.find((r) => r.id === req.params.id);
  if (!report) throw new ApiError(404, "Report not found");

  const newStatus = status || (report.status === "Pending" ? "Under Review" : report.status);
  const updated = reportsStore.update((r) => r.id === req.params.id, {
    ...(phiId && { phi: phiName, phiId }),
    status: newStatus,
    updated: new Date().toISOString(),
    history: [...(report.history || []), { status: newStatus, date: new Date().toISOString(), comments: comments || `Assigned to ${phiName}` }],
  });

  res.json(updated);
});

export const adminUpdateStatus = asyncHandler(async (req, res) => {
  const { status, comments } = req.body;
  if (!status) throw new ApiError(400, "Status is required");

  const report = reportsStore.find((r) => r.id === req.params.id);
  if (!report) throw new ApiError(404, "Report not found");

  const updated = reportsStore.update((r) => r.id === req.params.id, {
    status,
    updated: new Date().toISOString(),
    history: [...(report.history || []), { status, date: new Date().toISOString(), comments: comments || "" }],
  });

  res.json(updated);
});

export const createPhi = asyncHandler(async (req, res) => {
  const { name, email, mobile, area, password } = req.body;
  if (!name || !email || !password) throw new ApiError(400, "Name, email and password are required");

  const passwordHash = await bcrypt.hash(password, 10);
  const newPhi = {
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
  };

  usersStore.insert(newPhi);
  res.status(201).json(publicUser(newPhi));
});

export const assignArea = asyncHandler(async (req, res) => {
  const { areaId } = req.body;
  const area = areasStore.find((a) => a.id === areaId);
  if (!area) throw new ApiError(404, "Area not found");

  const phi = usersStore.find((u) => u.id === req.params.phiId && u.role === "phi");
  if (!phi) throw new ApiError(404, "PHI not found");

  areasStore.update((a) => a.id === areaId, { phi: phi.name, phiId: phi.id });
  const updatedPhi = usersStore.update((u) => u.id === phi.id, { area: area.name });

  res.json(publicUser(updatedPhi));
});

// ---- Areas ----

export const listAreas = asyncHandler(async (req, res) => {
  res.json(areasStore.all());
});

export const createArea = asyncHandler(async (req, res) => {
  const { name, risk = "Medium", phiId, x = 50, y = 50 } = req.body;
  if (!name) throw new ApiError(400, "Area name is required");

  let phi = null;
  if (phiId) phi = usersStore.find((u) => u.id === phiId && u.role === "phi");

  const area = {
    id: nextId("A"),
    name,
    risk,
    phi: phi?.name || "—",
    phiId: phi?.id || null,
    reports: 0,
    x,
    y,
  };

  areasStore.insert(area);
  res.status(201).json(area);
});

export const updateArea = asyncHandler(async (req, res) => {
  const updated = areasStore.update((a) => a.id === req.params.id, req.body);
  if (!updated) throw new ApiError(404, "Area not found");
  res.json(updated);
});

export const deleteArea = asyncHandler(async (req, res) => {
  areasStore.remove((a) => a.id === req.params.id);
  res.json({ success: true });
});

// ---- Statistics & Settings ----

export const statistics = asyncHandler(async (req, res) => {
  const reports = reportsStore.all();

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
  res.json(settingsStore.get());
});

export const updateSettings = asyncHandler(async (req, res) => {
  const updated = settingsStore.update(req.body);
  res.json(updated);
});
