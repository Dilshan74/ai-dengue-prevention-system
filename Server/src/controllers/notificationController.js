import mongoose from "mongoose";
import Notification from "../models/notification.js";
import { notificationsStore } from "../data/stores.js";
import { asyncHandler, paginate, ApiError } from "../utils/helpers.js";

function getLocalNotifications(user, unread) {
  let items = notificationsStore.filter((n) => n.userId === user.id || n.role === user.role);
  if (unread === "true") items = items.filter((n) => !n.read);
  return items;
}

export const list = asyncHandler(async (req, res) => {
  const { unread, page = 1, pageSize = 20 } = req.query;

  let items = [];
  if (mongoose.connection.readyState === 1) {
    try {
      const query = {
        $or: [{ userId: req.user.id }, { role: req.user.role }],
      };
      if (unread === "true") query.read = false;
      items = await Notification.find(query).sort({ createdAt: -1 }).lean();
    } catch (e) {
      items = getLocalNotifications(req.user, unread);
    }
  } else {
    items = getLocalNotifications(req.user, unread);
  }

  res.json(paginate(items, { page, pageSize }));
});

export const markRead = asyncHandler(async (req, res) => {
  let updated = null;
  if (mongoose.connection.readyState === 1) {
    try {
      const query = {
        id: req.params.id,
        $or: [{ userId: req.user.id }, { role: req.user.role }],
      };
      const notification = await Notification.findOne(query).lean();
      if (!notification) throw new ApiError(404, "Notification not found");

      updated = await Notification.findOneAndUpdate(
        { id: notification.id },
        { read: true },
        { new: true }
      ).lean();
    } catch (e) {
      const n = notificationsStore.find((item) => item.id === req.params.id);
      if (!n) throw new ApiError(404, "Notification not found");
      updated = notificationsStore.update((item) => item.id === req.params.id, { read: true });
    }
  } else {
    const n = notificationsStore.find((item) => item.id === req.params.id);
    if (!n) throw new ApiError(404, "Notification not found");
    updated = notificationsStore.update((item) => item.id === req.params.id, { read: true });
  }

  res.json(updated);
});

export const markAllRead = asyncHandler(async (req, res) => {
  if (mongoose.connection.readyState === 1) {
    try {
      const query = {
        $or: [{ userId: req.user.id }, { role: req.user.role }],
        read: false,
      };
      const result = await Notification.updateMany(query, { read: true });
      return res.json({ success: true, count: result.modifiedCount });
    } catch (e) {
      const unreadList = notificationsStore.filter((n) => (n.userId === req.user.id || n.role === req.user.role) && !n.read);
      unreadList.forEach((n) => notificationsStore.update((item) => item.id === n.id, { read: true }));
      return res.json({ success: true, count: unreadList.length });
    }
  }

  const unreadList = notificationsStore.filter((n) => (n.userId === req.user.id || n.role === req.user.role) && !n.read);
  unreadList.forEach((n) => notificationsStore.update((item) => item.id === n.id, { read: true }));
  res.json({ success: true, count: unreadList.length });
});

export const unreadCount = asyncHandler(async (req, res) => {
  if (mongoose.connection.readyState === 1) {
    try {
      const count = await Notification.countDocuments({
        $or: [{ userId: req.user.id }, { role: req.user.role }],
        read: false,
      });
      return res.json({ count });
    } catch (e) {
      const count = notificationsStore.filter((n) => (n.userId === req.user.id || n.role === req.user.role) && !n.read).length;
      return res.json({ count });
    }
  }

  const count = notificationsStore.filter((n) => (n.userId === req.user.id || n.role === req.user.role) && !n.read).length;
  res.json({ count });
});
