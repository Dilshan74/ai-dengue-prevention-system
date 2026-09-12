import mongoose from "mongoose";
import Report from "../models/report.js";
import Visit from "../models/visit.js";
import User from "../models/user.js";
import Notification from "../models/notification.js";
import { reportsStore, visitsStore, usersStore, notificationsStore } from "../data/stores.js";
import { asyncHandler, paginate, nextId, ApiError } from "../utils/helpers.js";
import { uploadUrl } from "../middleware/upload.js";

export const dashboard = asyncHandler(async (req, res) => {
  let myReports = [];
  let myVisits = [];

  if (mongoose.connection.readyState === 1) {
    try {
      myReports = await Report.find({ phiId: req.user.id }).lean();
      myVisits = await Visit.find({ phiId: req.user.id }).lean();
    } catch (e) {
      myReports = reportsStore.filter((r) => r.phiId === req.user.id);
      myVisits = visitsStore.filter((v) => v.phiId === req.user.id);
    }
  } else {
    myReports = reportsStore.filter((r) => r.phiId === req.user.id);
    myVisits = visitsStore.filter((v) => v.phiId === req.user.id);
  }

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

  let items = [];
  if (mongoose.connection.readyState === 1) {
    try {
      const query = { phiId: req.user.id };
      if (status) query.status = status;
      if (risk) query.risk = risk;
      items = await Report.find(query).sort({ date: -1 }).lean();
    } catch (e) {
      items = reportsStore.filter((r) => r.phiId === req.user.id);
      if (status) items = items.filter((r) => r.status === status);
      if (risk) items = items.filter((r) => r.risk === risk);
    }
  } else {
    items = reportsStore.filter((r) => r.phiId === req.user.id);
    if (status) items = items.filter((r) => r.status === status);
    if (risk) items = items.filter((r) => r.risk === risk);
  }

  if (search) {
    const q = String(search).toLowerCase();
    items = items.filter(
      (r) => r.id.toLowerCase().includes(q) || r.location.toLowerCase().includes(q),
    );
  }

  res.json(paginate(items, { page, pageSize }));
});

export const getReport = asyncHandler(async (req, res) => {
  let report = null;
  if (mongoose.connection.readyState === 1) {
    try {
      report = await Report.findOne({ id: req.params.id, phiId: req.user.id }).lean();
    } catch (e) {
      report = reportsStore.find((r) => r.id === req.params.id && r.phiId === req.user.id);
    }
  } else {
    report = reportsStore.find((r) => r.id === req.params.id && r.phiId === req.user.id);
  }

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
  let report = null;
  if (mongoose.connection.readyState === 1) {
    try {
      report = await Report.findOne({ id: req.params.id, phiId: req.user.id }).lean();
    } catch (e) {
      report = reportsStore.find((r) => r.id === req.params.id && r.phiId === req.user.id);
    }
  } else {
    report = reportsStore.find((r) => r.id === req.params.id && r.phiId === req.user.id);
  }

  if (!report) throw new ApiError(404, "Report not found");

  const next = addHistory(report, "Accepted", req.body?.comments);
  let updated = null;

  if (mongoose.connection.readyState === 1) {
    try {
      updated = await Report.findOneAndUpdate({ id: report.id }, next, { new: true }).lean();
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
    } catch (e) {
      updated = reportsStore.replace((r) => r.id === report.id, next);
    }
  } else {
    updated = reportsStore.replace((r) => r.id === report.id, next);
  }

  res.json(updated);
});

export const rejectReport = asyncHandler(async (req, res) => {
  let report = null;
  if (mongoose.connection.readyState === 1) {
    try {
      report = await Report.findOne({ id: req.params.id, phiId: req.user.id }).lean();
    } catch (e) {
      report = reportsStore.find((r) => r.id === req.params.id && r.phiId === req.user.id);
    }
  } else {
    report = reportsStore.find((r) => r.id === req.params.id && r.phiId === req.user.id);
  }

  if (!report) throw new ApiError(404, "Report not found");

  const next = addHistory(report, "Rejected", req.body?.comments);
  let updated = null;

  if (mongoose.connection.readyState === 1) {
    try {
      updated = await Report.findOneAndUpdate({ id: report.id }, next, { new: true }).lean();
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
    } catch (e) {
      updated = reportsStore.replace((r) => r.id === report.id, next);
    }
  } else {
    updated = reportsStore.replace((r) => r.id === report.id, next);
  }

  res.json(updated);
});

export const listVisits = asyncHandler(async (req, res) => {
  let items = [];
  if (mongoose.connection.readyState === 1) {
    try {
      items = await Visit.find({ phiId: req.user.id }).lean();
    } catch (e) {
      items = visitsStore.filter((v) => v.phiId === req.user.id);
    }
  } else {
    items = visitsStore.filter((v) => v.phiId === req.user.id);
  }
  res.json(items);
});

export const updateVisit = asyncHandler(async (req, res) => {
  let visit = null;
  if (mongoose.connection.readyState === 1) {
    try {
      visit = await Visit.findOne({ id: req.params.id, phiId: req.user.id }).lean();
    } catch (e) {
      visit = visitsStore.find((v) => v.id === req.params.id && v.phiId === req.user.id);
    }
  } else {
    visit = visitsStore.find((v) => v.id === req.params.id && v.phiId === req.user.id);
  }

  if (!visit) throw new ApiError(404, "Visit not found");

  let updated = null;
  if (mongoose.connection.readyState === 1) {
    try {
      updated = await Visit.findOneAndUpdate({ id: visit.id }, req.body, { new: true }).lean();
      if (req.body.status === "Completed") {
        const report = await Report.findOne({ id: visit.reportId }).lean();
        if (report) {
          const next = addHistory(report, "Inspection Completed", "Site visit completed");
          await Report.findOneAndUpdate({ id: report.id }, next);
        }
      }
    } catch (e) {
      updated = visitsStore.update((v) => v.id === visit.id, req.body);
    }
  } else {
    updated = visitsStore.update((v) => v.id === visit.id, req.body);
  }

  res.json(updated);
});

export const uploadInspectionPhotos = asyncHandler(async (req, res) => {
  let visit = null;
  if (mongoose.connection.readyState === 1) {
    try {
      visit = await Visit.findOne({ id: req.params.id, phiId: req.user.id }).lean();
    } catch (e) {
      visit = visitsStore.find((v) => v.id === req.params.id && v.phiId === req.user.id);
    }
  } else {
    visit = visitsStore.find((v) => v.id === req.params.id && v.phiId === req.user.id);
  }

  if (!visit) throw new ApiError(404, "Visit not found");

  const urls = (req.files || []).map((f) => uploadUrl(f.filename));
  const newPhotos = [...(visit.photos || []), ...urls];

  let updated = null;
  if (mongoose.connection.readyState === 1) {
    try {
      updated = await Visit.findOneAndUpdate(
        { id: visit.id },
        { photos: newPhotos },
        { new: true }
      ).lean();
    } catch (e) {
      updated = visitsStore.update((v) => v.id === visit.id, { photos: newPhotos });
    }
  } else {
    updated = visitsStore.update((v) => v.id === visit.id, { photos: newPhotos });
  }

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

  let updated = null;
  if (mongoose.connection.readyState === 1) {
    try {
      updated = await User.findOneAndUpdate({ id: req.user.id }, patch, { new: true }).lean();
    } catch (e) {
      updated = usersStore.update((u) => u.id === req.user.id, patch);
    }
  } else {
    updated = usersStore.update((u) => u.id === req.user.id, patch);
  }

  const { passwordHash, ...rest } = updated || req.user; // eslint-disable-line no-unused-vars
  res.json(rest);
});
