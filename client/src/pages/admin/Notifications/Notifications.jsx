import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { Trash2, RefreshCw, BellOff } from "lucide-react";
import Button from "../../../components/common/Button";
import PageHeader from "../../../components/common/PageHeader";
import NotificationItem from "../../../components/notifications/NotificationItem";
import EmptyState from "../../../components/common/EmptyState";
import adminService from "../../../services/adminService";

function timeAgo(dateStr) {
  if (!dateStr) return "—";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return `${Math.floor(days / 7)}w ago`;
}

export default function Notifications() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const data = await adminService.notifications();
      setItems(data);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to load notifications");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const markRead = async (id) => {
    const item = items.find(n => n.id === id);
    if (item && item.read) return;
    try {
      await adminService.markNotificationRead(id);
      setItems(items.map(n => n.id === id ? { ...n, read: true } : n));
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to mark as read");
    }
  };

  const deleteNotification = async (id, e) => {
    if (e) e.stopPropagation();
    try {
      await adminService.deleteNotification(id);
      setItems(items.filter(n => n.id !== id));
      toast.success("Notification deleted");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to delete notification");
    }
  };

  const markAllRead = async () => {
    const unreadIds = items.filter(n => !n.read).map(n => n.id);
    if (unreadIds.length === 0) return;
    try {
      await Promise.all(unreadIds.map(id => adminService.markNotificationRead(id)));
      setItems(items.map(n => ({ ...n, read: true })));
      toast.success("All notifications marked as read");
    } catch (err) {
      toast.error("Failed to mark all as read");
    }
  };

  const unreadCount = items.filter(n => !n.read).length;

  return (
    <>
      <PageHeader
        title="Notifications"
        description={`System alerts · ${unreadCount} unread`}
        action={
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={fetchNotifications} disabled={loading} title="Refresh">
               <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </Button>
            <Button variant="outline" onClick={markAllRead} disabled={unreadCount === 0 || loading}>
              Mark all as read
            </Button>
          </div>
        }
      />
      
      {loading ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground">
          <RefreshCw className="mr-2 h-5 w-5 animate-spin" /> Loading notifications…
        </div>
      ) : !items.length ? (
        <EmptyState
          icon={BellOff}
          title="No notifications"
          description="System events and alerts will appear here."
        />
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.id} className="relative group flex items-center">
              <div className="flex-1">
                <NotificationItem 
                   notification={{...item, time: timeAgo(item.createdAt)}} 
                   onRead={() => markRead(item.id)} 
                />
              </div>
              <button
                onClick={(e) => deleteNotification(item.id, e)}
                className="absolute right-4 opacity-0 group-hover:opacity-100 transition-opacity p-2 text-muted-foreground hover:text-destructive bg-card rounded-md border border-border shadow-sm"
                title="Delete notification"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
