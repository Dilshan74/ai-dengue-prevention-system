import Report from "../models/report.js";
import Visit from "../models/visit.js";
import User from "../models/user.js";
import Notification from "../models/notification.js";
import { asyncHandler, paginate, nextId, ApiError } from "../utils/helpers.js";
import { uploadUrl } from "../middleware/upload.js";

export const dashboard = asyncHandler(async (req, res) => {
  const myReports = await Report.find({ phiId: req.user.id }).lean();
  const myVisits = await Visit.find({ phiId: req.user.id }).lean();

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

  const query = { phiId: req.user.id };
  if (status) query.status = status;
  if (risk) query.risk = risk;

  let items = await Report.find(query).sort({ date: -1 }).lean();

  if (search) {
    const q = String(search).toLowerCase();
    items = items.filter(
      (r) => r.id.toLowerCase().includes(q) || r.location.toLowerCase().includes(q),
    );
  }

  res.json(paginate(items, { page, pageSize }));
});

export const getReport = asyncHandler(async (req, res) => {
  const report = await Report.findOne({ id: req.params.id, phiId: req.user.id }).lean();
  if (!report) throw new ApiError(404, "Report not found");
  res.json(report);
});

function addHistory(report, status, comments) {
  return {
    ...report,
    status,
    updated: new Date(),
    history: [...(report.history || []), { status, date: new Date(), comments: comments || "" }],
  };
}

export const acceptReport = asyncHandler(async (req, res) => {
  const report = await Report.findOne({ id: req.params.id, phiId: req.user.id }).lean();
  if (!report) throw new ApiError(404, "Report not found");

  const next = addHistory(report, "Accepted", req.body?.comments);
  const updated = await Report.findOneAndUpdate({ id: report.id }, next, { new: true }).lean();

  await Notification.create({
    id: nextId("N"),
    userId: report.citizenId,
    role: "citizen",
    type: "success",
    title: "Report Accepted",
    body: `${report.id} was accepted by PHI ${req.user.name}.`,
    read: false,
    createdAt: new Date(),
  });

  res.json(updated);
});

export const rejectReport = asyncHandler(async (req, res) => {
  const report = await Report.findOne({ id: req.params.id, phiId: req.user.id }).lean();
  if (!report) throw new ApiError(404, "Report not found");

  const next = addHistory(report, "Rejected", req.body?.comments);
  const updated = await Report.findOneAndUpdate({ id: report.id }, next, { new: true }).lean();

  await Notification.create({
    id: nextId("N"),
    userId: report.citizenId,
    role: "citizen",
    type: "warning",
    title: "Report Rejected",
    body: `${report.id} was rejected: ${req.body?.comments || "No reason given"}`,
    read: false,
    createdAt: new Date(),
  });

  res.json(updated);
});

export const listVisits = asyncHandler(async (req, res) => {
  const items = await Visit.find({ phiId: req.user.id }).lean();
  res.json(items);
});

export const updateVisit = asyncHandler(async (req, res) => {
  const visit = await Visit.findOne({ id: req.params.id, phiId: req.user.id }).lean();
  if (!visit) throw new ApiError(404, "Visit not found");

  const updated = await Visit.findOneAndUpdate({ id: visit.id }, req.body, { new: true }).lean();

  // If the checklist marks the site cleared, progress the linked report.
  if (req.body.status === "Completed") {
    const report = await Report.findOne({ id: visit.reportId }).lean();
    if (report) {
      const next = addHistory(report, "Inspection Completed", "Site visit completed");
      await Report.findOneAndUpdate({ id: report.id }, next);
    }
  }

  res.json(updated);
});

export const uploadInspectionPhotos = asyncHandler(async (req, res) => {
  const visit = await Visit.findOne({ id: req.params.id, phiId: req.user.id }).lean();
  if (!visit) throw new ApiError(404, "Visit not found");

  const urls = (req.files || []).map((f) => uploadUrl(f.filename));
  const updated = await Visit.findOneAndUpdate(
    { id: visit.id },
    { photos: [...(visit.photos || []), ...urls] },
    { new: true }
  ).lean();

  res.json(updated);
});

export const profile = asyncHandler(async (req, res) => {
  const { passwordHash, ...rest } = req.user; // eslint-disable-line no-unused-vars
  res.json(rest);
});

export const updateProfile = asyncHandler(async (req, res) => {
  const { name, mobile, area } = req.body;
  const patch = {};
  if (name) patch.name = name;
  if (mobile) patch.mobile = mobile;
  if (area) patch.area = area;

  const updated = await User.findOneAndUpdate({ id: req.user.id }, patch, { new: true }).lean();
  const { passwordHash, ...rest } = updated; // eslint-disable-line no-unused-vars
  res.json(rest);
});
