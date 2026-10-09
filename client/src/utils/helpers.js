import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merge conditional Tailwind class names. */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/** "Nimal Perera" -> "NP" */
export function initials(name = "") {
  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

/** Slice an array into a single page. */
export function paginate(items, page, perPage) {
  const start = (page - 1) * perPage;
  return items.slice(start, start + perPage);
}

export function totalPages(count, perPage) {
  return Math.max(1, Math.ceil(count / perPage));
}

/** Case-insensitive search across the given object keys. */
export function matchesQuery(item, query, keys) {
  if (!query) return true;
  const needle = query.trim().toLowerCase();
  return keys.some((key) => String(item[key] ?? "").toLowerCase().includes(needle));
}

export function percent(value, total) {
  if (!total) return 0;
  return Math.round((value / total) * 100);
}

export function timeAgo(dateStr) {
  if (!dateStr) return "just now";
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

