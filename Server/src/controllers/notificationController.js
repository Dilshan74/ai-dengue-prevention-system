import { notificationsStore } from "../data/stores.js";
import { asyncHandler, paginate, ApiError } from "../utils/helpers.js";

function scoped(user) {
  return notificationsStore.filter((n) => n.userId === user.id || n.role === user.role);
}

export const list = asyncHandler(async (req, res) => {
  const { unread, page = 1, pageSize = 20 } = req.query;
  let items = scoped(req.user);
  if (unread === "true") items = items.filter((n) => !n.read);
  items = [...items].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json(paginate(items, { page, pageSize }));
});

export const markRead = asyncHandler(async (req, res) => {
  const notification = scoped(req.user).find((n) => n.id === req.params.id);
  if (!notification) throw new ApiError(404, "Notification not found");
  const updated = notificationsStore.update((n) => n.id === notification.id, { read: true });
  res.json(updated);
});

export const markAllRead = asyncHandler(async (req, res) => {
  const mine = scoped(req.user);
  mine.forEach((n) => notificationsStore.update((x) => x.id === n.id, { read: true }));
  res.json({ success: true, count: mine.length });
});

export const unreadCount = asyncHandler(async (req, res) => {
  const count = scoped(req.user).filter((n) => !n.read).length;
  res.json({ count });
});
