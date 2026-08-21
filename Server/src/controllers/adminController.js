import bcrypt from "bcryptjs";
import {
  usersStore,
  reportsStore,
  areasStore,
  settingsStore,
} from "../data/stores.js";
import { asyncHandler, paginate, nextId, ApiError } from "../utils/helpers.js";

function publicUser(user) {
  const { passwordHash, ...rest } = user; // eslint-disable-line no-unused-vars
  return rest;
}

export const dashboard = asyncHandler(async (req, res) => {
  const users = usersStore.all();
  const reports = reportsStore.all();

  const stats = {
    totalUsers: users.filter((u) => u.role === "citizen").length,
    totalPhis: users.filter((u) => u.role === "phi").length,
    totalReports: reports.length,
    highRiskReports: reports.filter((r) => r.risk === "High").length,
    resolvedReports: reports.filter((r) => r.status === "Resolved").length,
    pendingReports: reports.filter((r) => r.status === "Pending" || r.status === "Under Review").length,
  };

  res.json({
    stats,
    recentReports: [...reports].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 8),
  });
});

// ---- Users ----

export const listUsers = asyncHandler(async (req, res) => {
  const { role, status, search, page = 1, pageSize = 10 } = req.query;
  let items = usersStore.filter((u) => u.role === "citizen"); // default: citizen users list
  if (role) items = usersStore.filter((u) => u.role === role);
  if (status) items = items.filter((u) => u.status === status);
  if (search) {
    const q = String(search).toLowerCase();
    items = items.filter(
      (u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q),
    );
  }
  const result = paginate(items.map(publicUser), { page, pageSize });
  res.json(result);
});

export const createUser = asyncHandler(async (req, res) => {
  const { name, email, mobile, address, password, role = "citizen" } = req.body;
  if (!name || !email || !password) throw new ApiError(400, "Name, email and password are required");

  const existing = usersStore.find((u) => u.email.toLowerCase() === String(email).toLowerCase());
  if (existing) throw new ApiError(409, "A user with this email already exists");

  const passwordHash = await bcrypt.hash(password, 10);
  const user = {
    id: nextId("U"),
    name,
    email,
    mobile: mobile || "",
    address: address || "",
    passwordHash,
    role,
    status: "Active",
    joined: new Date().toISOString().slice(0, 10),
  };
  usersStore.insert(user);
  res.status(201).json(publicUser(user));
});

export const updateUser = asyncHandler(async (req, res) => {
  const { password, ...patch } = req.body;
  if (password) patch.passwordHash = await bcrypt.hash(password, 10);

  const updated = usersStore.update((u) => u.id === req.params.id, patch);
  if (!updated) throw new ApiError(404, "User not found");
  res.json(publicUser(updated));
});

export const toggleUserStatus = asyncHandler(async (req, res) => {
  const user = usersStore.find((u) => u.id === req.params.id);
  if (!user) throw new ApiError(404, "User not found");

  const nextStatus = user.status === "Active" ? "Inactive" : "Active";
  const updated = usersStore.update((u) => u.id === req.params.id, { status: nextStatus });
  res.json(publicUser(updated));
});

export const deleteUser = asyncHandler(async (req, res) => {
  const removed = usersStore.remove((u) => u.id === req.params.id);
  if (!removed) throw new ApiError(404, "User not found");
  res.json({ success: true });
});

// ---- PHIs ----

export const listPhis = asyncHandler(async (req, res) => {
  const phis = usersStore.filter((u) => u.role === "phi").map(publicUser);
  res.json(phis);
});

export const createPhi = asyncHandler(async (req, res) => {
  const { name, email, mobile, area, password } = req.body;
  if (!name || !email || !password) throw new ApiError(400, "Name, email and password are required");

  const existing = usersStore.find((u) => u.email.toLowerCase() === String(email).toLowerCase());
  if (existing) throw new ApiError(409, "A user with this email already exists");

  const passwordHash = await bcrypt.hash(password, 10);
  const phi = {
    id: nextId("PHI"),
    name,
    email,
    mobile: mobile || "",
    passwordHash,
    role: "phi",
    area: area || "",
    inspections: 0,
    rating: 0,
    status: "Active",
  };
  usersStore.insert(phi);
  res.status(201).json(publicUser(phi));
});

export const assignArea = asyncHandler(async (req, res) => {
  const { areaId } = req.body;
  const phi = usersStore.find((u) => u.id === req.params.phiId && u.role === "phi");
  if (!phi) throw new ApiError(404, "PHI not found");

  const area = areasStore.find((a) => a.id === areaId);
  if (!area) throw new ApiError(404, "Area not found");

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
  const removed = areasStore.remove((a) => a.id === req.params.id);
  if (!removed) throw new ApiError(404, "Area not found");
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
  res.json(settingsStore.set(req.body));
});
