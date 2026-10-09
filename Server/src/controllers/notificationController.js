import Notification from "../models/notification.js";
import { asyncHandler, paginate, ApiError } from "../utils/helpers.js";

function userNotificationQuery(user) {
  return {
    $or: [
      { userId: user.id },
      { userId: null, role: user.role },
      { userId: "", role: user.role },
    ],
  };
}

export const list = asyncHandler(async (req, res) => {
  const { unread, page = 1, pageSize = 20 } = req.query;

  const query = userNotificationQuery(req.user);
  if (unread === "true") query.read = false;

  const items = await Notification.find(query).sort({ createdAt: -1 }).lean();
  res.json(paginate(items, { page, pageSize }));
});

export const markRead = asyncHandler(async (req, res) => {
  const query = {
    id: req.params.id,
    ...userNotificationQuery(req.user),
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
    ...userNotificationQuery(req.user),
    read: false,
  };
  const result = await Notification.updateMany(query, { read: true });
  res.json({ success: true, count: result.modifiedCount });
});

export const unreadCount = asyncHandler(async (req, res) => {
  const count = await Notification.countDocuments({
    ...userNotificationQuery(req.user),
    read: false,
  });
  res.json({ count });
});
