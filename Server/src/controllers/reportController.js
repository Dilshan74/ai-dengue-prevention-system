import Report from "../models/report.js";
import { asyncHandler, paginate, ApiError } from "../utils/helpers.js";
import { toCsv, toExcel, toPdf } from "../utils/exportUtils.js";

/** Scope the report query to what the caller's role is allowed to see. */
function scopedQuery(user) {
  if (user.role === "admin") return {};
  if (user.role === "phi") return { phiId: user.id };
  return { citizenId: user.id };
}

export const list = asyncHandler(async (req, res) => {
  const { status, risk, page = 1, pageSize = 10 } = req.query;

  const query = scopedQuery(req.user);
  if (status) query.status = status;
  if (risk) query.risk = risk;

  let items = await Report.find(query).sort({ date: -1 }).lean();
  res.json(paginate(items, { page, pageSize }));
});

export const byId = asyncHandler(async (req, res) => {
  const query = { id: req.params.id, ...scopedQuery(req.user) };
  const report = await Report.findOne(query).lean();
  if (!report) throw new ApiError(404, "Report not found");
  res.json(report);
});

export const updateStatus = asyncHandler(async (req, res) => {
  const { status, comments } = req.body;
  if (!status) throw new ApiError(400, "Status is required");

  const query = { id: req.params.id, ...scopedQuery(req.user) };
  const report = await Report.findOne(query).lean();
  if (!report) throw new ApiError(404, "Report not found");

  const updated = await Report.findOneAndUpdate(
    { id: report.id },
    {
      status,
      updated: new Date(),
      $push: { history: { status, date: new Date(), comments: comments || "" } },
    },
    { new: true }
  ).lean();

  res.json(updated);
});

export const monthly = asyncHandler(async (req, res) => {
  const reports = await Report.find(scopedQuery(req.user)).lean();
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
  const items = await Report.find(scopedQuery(req.user)).lean();

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
