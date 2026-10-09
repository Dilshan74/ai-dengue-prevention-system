import { createContext, useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import notificationService from "../services/notificationService";

export const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const [items, setItems] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await notificationService.list({ pageSize: 50 });
      const list = res?.data || res?.items || (Array.isArray(res) ? res : []);
      setItems(list);
      const count = list.filter((n) => !n.read).length;
      setUnreadCount(count);
    } catch {
      // Ignored if user not logged in yet
    }
  }, []);

  useEffect(() => {
    fetchNotifications();

    // Poll every 8 seconds for new notifications and live message updates
    const interval = setInterval(() => {
      fetchNotifications();
    }, 8000);

    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const markAllRead = useCallback(async () => {
    try {
      await notificationService.markAllRead();
      setItems((current) => current.map((item) => ({ ...item, read: true })));
      setUnreadCount(0);
      toast.success("All notifications marked as read");
    } catch (err) {
      setItems((current) => current.map((item) => ({ ...item, read: true })));
      setUnreadCount(0);
    }
  }, []);

  const markRead = useCallback(async (id) => {
    try {
      await notificationService.markRead(id);
    } catch {
      // Ignore
    } finally {
      setItems((current) =>
        current.map((item) => (item.id === id ? { ...item, read: true } : item)),
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }
  }, []);

  const notify = useCallback((notification) => {
    setItems((current) => [
      { id: Date.now(), read: false, time: "just now", ...notification },
      ...current,
    ]);
    setUnreadCount((prev) => prev + 1);
    const type = notification.type === "warning" ? "warning" : notification.type;
    const show = toast[type] ?? toast;
    show(notification.title, { description: notification.body });
  }, []);

  const value = useMemo(
    () => ({
      items,
      unreadCount,
      markRead,
      markAllRead,
      notify,
      refresh: fetchNotifications,
    }),
    [items, unreadCount, markRead, markAllRead, notify, fetchNotifications],
  );

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export default NotificationProvider;
