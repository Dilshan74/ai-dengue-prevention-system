import Notification from "../models/notification.js";
import { asyncHandler, paginate, ApiError } from "../utils/helpers.js";

export const list = asyncHandler(async (req, res) => {
  const { unread, page = 1, pageSize = 20 } = req.query;

  const query = {
    $or: [{ userId: req.user.id }, { role: req.user.role }],
  };
  if (unread === "true") query.read = false;

  const items = await Notification.find(query).sort({ createdAt: -1 }).lean();
  res.json(paginate(items, { page, pageSize }));
});

export const markRead = asyncHandler(async (req, res) => {
  const query = {
    id: req.params.id,
    $or: [{ userId: req.user.id }, { role: req.user.role }],
  };
  const notification = await Notification.findOne(query).lean();
  if (!notification) throw new ApiError(404, "Notification not found");

  const updated = await Notification.findOneAndUpdate(
    { id: notification.id },
    { read: true },
    { new: true }
  ).lean();
  res.json(updated);
});

export const markAllRead = asyncHandler(async (req, res) => {
  const query = {
    $or: [{ userId: req.user.id }, { role: req.user.role }],
    read: false,
  };
  const result = await Notification.updateMany(query, { read: true });
  res.json({ success: true, count: result.modifiedCount });
});

export const unreadCount = asyncHandler(async (req, res) => {
  const count = await Notification.countDocuments({
    $or: [{ userId: req.user.id }, { role: req.user.role }],
    read: false,
  });
  res.json({ count });
});
