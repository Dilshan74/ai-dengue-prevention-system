import { v4 as uuid } from "uuid";

/** Wraps an async route handler so thrown errors reach Express's error middleware. */
export const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

import { reportsStore } from "../data/stores.js";

/** Sequential, human-friendly report IDs like DG-1042. */
let reportCounter = 1042;
export function nextReportId() {
  try {
    const all = reportsStore.all ? reportsStore.all() : [];
    let max = reportCounter;
    for (const r of all) {
      const match = r.id?.match(/DG-(\d+)/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > max) max = num;
      }
    }
    reportCounter = max + 1;
    return `DG-${reportCounter}`;
  } catch {
    reportCounter += 1;
    return `DG-${reportCounter}`;
  }
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
