import mongoose from "mongoose";
import Report from "../models/report.js";
import { reportsStore } from "../data/stores.js";
import { asyncHandler, paginate, ApiError } from "../utils/helpers.js";
import { toCsv, toExcel, toPdf } from "../utils/exportUtils.js";

/** Scope the report query to what the caller's role is allowed to see. */
function scopedReports(user) {
  const all = reportsStore.all();
  if (user.role === "admin") return all;
  if (user.role === "phi") return all.filter((r) => r.phiId === user.id);
  return all.filter((r) => r.citizenId === user.id);
}

function scopedQuery(user) {
  if (user.role === "admin") return {};
  if (user.role === "phi") return { phiId: user.id };
  return { citizenId: user.id };
}

export const list = asyncHandler(async (req, res) => {
  const { status, risk, page = 1, pageSize = 10 } = req.query;

  let items = [];
  if (mongoose.connection.readyState === 1) {
    try {
      const query = scopedQuery(req.user);
      if (status) query.status = status;
      if (risk) query.risk = risk;
      items = await Report.find(query).sort({ date: -1 }).lean();
    } catch (e) {
      items = scopedReports(req.user);
      if (status) items = items.filter((r) => r.status === status);
      if (risk) items = items.filter((r) => r.risk === risk);
    }
  } else {
    items = scopedReports(req.user);
    if (status) items = items.filter((r) => r.status === status);
    if (risk) items = items.filter((r) => r.risk === risk);
  }

  items = [...items].sort((a, b) => new Date(b.date) - new Date(a.date));
  res.json(paginate(items, { page, pageSize }));
});

export const byId = asyncHandler(async (req, res) => {
  let report = null;
  if (mongoose.connection.readyState === 1) {
    try {
      const query = { id: req.params.id, ...scopedQuery(req.user) };
      report = await Report.findOne(query).lean();
    } catch (e) {
      report = scopedReports(req.user).find((r) => r.id === req.params.id);
    }
  } else {
    report = scopedReports(req.user).find((r) => r.id === req.params.id);
  }

  if (!report) throw new ApiError(404, "Report not found");
  res.json(report);
});

export const updateStatus = asyncHandler(async (req, res) => {
  const { status, comments } = req.body;
  if (!status) throw new ApiError(400, "Status is required");

  let updated = null;
  if (mongoose.connection.readyState === 1) {
    try {
      const query = { id: req.params.id, ...scopedQuery(req.user) };
      const report = await Report.findOne(query).lean();
      if (!report) throw new ApiError(404, "Report not found");

      updated = await Report.findOneAndUpdate(
        { id: report.id },
        {
          status,
          updated: new Date(),
          $push: { history: { status, date: new Date(), comments: comments || "" } },
        },
        { new: true }
      ).lean();
    } catch (e) {
      const report = scopedReports(req.user).find((r) => r.id === req.params.id);
      if (!report) throw new ApiError(404, "Report not found");

      updated = reportsStore.replace((r) => r.id === report.id, {
        ...report,
        status,
        updated: new Date().toISOString(),
        history: [...(report.history || []), { status, date: new Date().toISOString(), comments: comments || "" }],
      });
    }
  } else {
    const report = scopedReports(req.user).find((r) => r.id === req.params.id);
    if (!report) throw new ApiError(404, "Report not found");

    updated = reportsStore.replace((r) => r.id === report.id, {
      ...report,
      status,
      updated: new Date().toISOString(),
      history: [...(report.history || []), { status, date: new Date().toISOString(), comments: comments || "" }],
    });
  }

  res.json(updated);
});

export const monthly = asyncHandler(async (req, res) => {
  let reports = [];
  if (mongoose.connection.readyState === 1) {
    try {
      reports = await Report.find(scopedQuery(req.user)).lean();
    } catch (e) {
      reports = scopedReports(req.user);
    }
  } else {
    reports = scopedReports(req.user);
  }

  const byMonth = {};
  reports.forEach((r) => {
    const month = new Date(r.date).toLocaleString("en-US", { month: "short" });
    byMonth[month] = byMonth[month] || { name: month, reports: 0, resolved: 0 };
    byMonth[month].reports += 1;
    if (r.status === "Resolved") byMonth[month].resolved += 1;
  });
  res.json(Object.values(byMonth));
});

export const exportReports = asyncHandler(async (req, res) => {
  const { format } = req.params;
  let items = [];
  if (mongoose.connection.readyState === 1) {
    try {
      items = await Report.find(scopedQuery(req.user)).lean();
    } catch (e) {
      items = scopedReports(req.user);
    }
  } else {
    items = scopedReports(req.user);
  }

  if (format === "csv") {
    const csv = toCsv(items);
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=reports.csv");
    return res.send(csv);
  }

  if (format === "excel") {
    const buffer = await toExcel(items);
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader("Content-Disposition", "attachment; filename=reports.xlsx");
    return res.send(Buffer.from(buffer));
  }

  if (format === "pdf") {
    const buffer = await toPdf(items);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "attachment; filename=reports.pdf");
    return res.send(buffer);
  }

  throw new ApiError(400, `Unsupported export format: ${format}`);
});
