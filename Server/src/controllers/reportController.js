import { reportsStore } from "../data/stores.js";
import { asyncHandler, paginate, ApiError } from "../utils/helpers.js";
import { toCsv, toExcel, toPdf } from "../utils/exportUtils.js";

/** Scope the report list to what the caller's role is allowed to see. */
function scopedReports(user) {
  const all = reportsStore.all();
  if (user.role === "admin") return all;
  if (user.role === "phi") return all.filter((r) => r.phiId === user.id);
  return all.filter((r) => r.citizenId === user.id);
}

export const list = asyncHandler(async (req, res) => {
  const { status, risk, page = 1, pageSize = 10 } = req.query;
  let items = scopedReports(req.user);
  if (status) items = items.filter((r) => r.status === status);
  if (risk) items = items.filter((r) => r.risk === risk);
  items = [...items].sort((a, b) => new Date(b.date) - new Date(a.date));
  res.json(paginate(items, { page, pageSize }));
});

export const byId = asyncHandler(async (req, res) => {
  const report = scopedReports(req.user).find((r) => r.id === req.params.id);
  if (!report) throw new ApiError(404, "Report not found");
  res.json(report);
});

export const updateStatus = asyncHandler(async (req, res) => {
  const { status, comments } = req.body;
  if (!status) throw new ApiError(400, "Status is required");

  const report = scopedReports(req.user).find((r) => r.id === req.params.id);
  if (!report) throw new ApiError(404, "Report not found");

  const updated = reportsStore.replace(
    (r) => r.id === report.id,
    {
      ...report,
      status,
      updated: new Date().toISOString(),
      history: [...(report.history || []), { status, date: new Date().toISOString(), comments: comments || "" }],
    },
  );

  res.json(updated);
});

export const monthly = asyncHandler(async (req, res) => {
  const reports = scopedReports(req.user);
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
  const items = scopedReports(req.user);

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
