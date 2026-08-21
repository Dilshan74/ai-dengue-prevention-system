import { reportsStore, visitsStore, usersStore, notificationsStore } from "../data/stores.js";
import { asyncHandler, paginate, nextId, ApiError } from "../utils/helpers.js";
import { uploadUrl } from "../middleware/upload.js";

export const dashboard = asyncHandler(async (req, res) => {
  const myReports = reportsStore.filter((r) => r.phiId === req.user.id);
  const myVisits = visitsStore.filter((v) => v.phiId === req.user.id);

  const stats = {
    assigned: myReports.length,
    pending: myReports.filter((r) => r.status === "Pending" || r.status === "Under Review").length,
    completed: myReports.filter((r) => r.status === "Resolved" || r.status === "Inspection Completed").length,
    scheduledVisits: myVisits.filter((v) => v.status === "Scheduled").length,
  };

  const recentReports = [...myReports]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 5);

  res.json({ stats, recentReports, upcomingVisits: myVisits.filter((v) => v.status === "Scheduled") });
});

export const listReports = asyncHandler(async (req, res) => {
  const { status, risk, search, page = 1, pageSize = 10 } = req.query;

  let items = reportsStore.filter((r) => r.phiId === req.user.id);
  if (status) items = items.filter((r) => r.status === status);
  if (risk) items = items.filter((r) => r.risk === risk);
  if (search) {
    const q = String(search).toLowerCase();
    items = items.filter(
      (r) => r.id.toLowerCase().includes(q) || r.location.toLowerCase().includes(q),
    );
  }
  items = [...items].sort((a, b) => new Date(b.date) - new Date(a.date));

  res.json(paginate(items, { page, pageSize }));
});

export const getReport = asyncHandler(async (req, res) => {
  const report = reportsStore.find((r) => r.id === req.params.id && r.phiId === req.user.id);
  if (!report) throw new ApiError(404, "Report not found");
  res.json(report);
});

function addHistory(report, status, comments) {
  return {
    ...report,
    status,
    updated: new Date().toISOString(),
    history: [...(report.history || []), { status, date: new Date().toISOString(), comments: comments || "" }],
  };
}

export const acceptReport = asyncHandler(async (req, res) => {
  const report = reportsStore.find((r) => r.id === req.params.id && r.phiId === req.user.id);
  if (!report) throw new ApiError(404, "Report not found");

  const updated = reportsStore.replace(
    (r) => r.id === report.id,
    addHistory(report, "Accepted", req.body?.comments),
  );

  notificationsStore.insert({
    id: nextId("N"),
    userId: report.citizenId,
    role: "citizen",
    type: "success",
    title: "Report Accepted",
    body: `${report.id} was accepted by PHI ${req.user.name}.`,
    read: false,
    createdAt: new Date().toISOString(),
  });

  res.json(updated);
});

export const rejectReport = asyncHandler(async (req, res) => {
  const report = reportsStore.find((r) => r.id === req.params.id && r.phiId === req.user.id);
  if (!report) throw new ApiError(404, "Report not found");

  const updated = reportsStore.replace(
    (r) => r.id === report.id,
    addHistory(report, "Rejected", req.body?.comments),
  );

  notificationsStore.insert({
    id: nextId("N"),
    userId: report.citizenId,
    role: "citizen",
    type: "warning",
    title: "Report Rejected",
    body: `${report.id} was rejected: ${req.body?.comments || "No reason given"}`,
    read: false,
    createdAt: new Date().toISOString(),
  });

  res.json(updated);
});

export const listVisits = asyncHandler(async (req, res) => {
  const items = visitsStore.filter((v) => v.phiId === req.user.id);
  res.json(items);
});

export const updateVisit = asyncHandler(async (req, res) => {
  const visit = visitsStore.find((v) => v.id === req.params.id && v.phiId === req.user.id);
  if (!visit) throw new ApiError(404, "Visit not found");

  const updated = visitsStore.update((v) => v.id === visit.id, req.body);

  // If the checklist marks the site cleared, progress the linked report.
  if (req.body.status === "Completed") {
    const report = reportsStore.find((r) => r.id === visit.reportId);
    if (report) {
      reportsStore.replace(
        (r) => r.id === report.id,
        addHistory(report, "Inspection Completed", "Site visit completed"),
      );
    }
  }

  res.json(updated);
});

export const uploadInspectionPhotos = asyncHandler(async (req, res) => {
  const visit = visitsStore.find((v) => v.id === req.params.id && v.phiId === req.user.id);
  if (!visit) throw new ApiError(404, "Visit not found");

  const urls = (req.files || []).map((f) => uploadUrl(f.filename));
  const updated = visitsStore.update((v) => v.id === visit.id, {
    photos: [...(visit.photos || []), ...urls],
  });

  res.json(updated);
});

export const profile = asyncHandler(async (req, res) => {
  const { passwordHash, ...rest } = req.user; // eslint-disable-line no-unused-vars
  res.json(rest);
});

export const updateProfile = asyncHandler(async (req, res) => {
  const { name, mobile, area } = req.body;
  const updated = usersStore.update((u) => u.id === req.user.id, {
    ...(name && { name }),
    ...(mobile && { mobile }),
    ...(area && { area }),
  });
  const { passwordHash, ...rest } = updated; // eslint-disable-line no-unused-vars
  res.json(rest);
});
