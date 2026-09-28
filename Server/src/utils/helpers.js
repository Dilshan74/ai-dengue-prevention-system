import { v4 as uuid } from "uuid";

/** Wraps an async route handler so thrown errors reach Express's error middleware. */
export const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

/** Sequential, collision-safe report IDs like DG-1044. */
export async function getNextReportId(ReportModel) {
  try {
    if (ReportModel) {
      const allReports = await ReportModel.find({ id: /^DG-\d+$/ }, "id").lean();
      if (allReports && allReports.length > 0) {
        let maxNum = 1042;
        for (const r of allReports) {
          const n = parseInt(r.id.replace("DG-", ""), 10);
          if (!isNaN(n) && n > maxNum) maxNum = n;
        }
        return `DG-${maxNum + 1}`;
      }
    }
  } catch (err) {
    console.warn("Could not query latest report id:", err);
  }
  return `DG-${Math.floor(Date.now() / 1000) % 90000 + 10000}`;
}

export function nextReportId() {
  return `DG-${Math.floor(Date.now() / 1000) % 90000 + 10000}`;
}

export function nextId(prefix) {
  return `${prefix}-${uuid().slice(0, 8)}`;
}

export function paginate(items, { page = 1, pageSize = 10 } = {}) {
  const p = Math.max(1, Number(page) || 1);
  const size = Math.max(1, Number(pageSize) || 10);
  const total = items.length;
  const start = (p - 1) * size;
  const data = items.slice(start, start + size);
  return {
    data,
    total,
    page: p,
    pageSize: size,
    totalPages: Math.max(1, Math.ceil(total / size)),
  };
}

export function timeAgo(dateStr) {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  return `${weeks}w ago`;
}

export class ApiError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}
