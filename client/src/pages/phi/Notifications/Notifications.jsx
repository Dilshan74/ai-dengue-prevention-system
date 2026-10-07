import { useEffect, useState } from "react";
import { toast } from "sonner";
import Button from "../../../components/common/Button";
import PageHeader from "../../../components/common/PageHeader";
import NotificationList from "../../../components/notifications/NotificationList";
import notificationService from "../../../services/notificationService";

export default function Notifications() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = () => {
    setLoading(true);
    notificationService
      .list()
      .then((res) => {
        const list = res?.items || (Array.isArray(res) ? res : []);
        setItems(list);
      })
      .catch((err) => {
        console.error("Failed to load notifications:", err);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const markRead = async (id) => {
    try {
      await notificationService.markRead(id);
      setItems((current) =>
        current.map((item) => (item.id === id ? { ...item, read: true } : item)),
      );
    } catch {
      setItems((current) =>
        current.map((item) => (item.id === id ? { ...item, read: true } : item)),
      );
    }
  };

  const markAllRead = async () => {
    try {
      await notificationService.markAllRead();
      setItems((current) => current.map((item) => ({ ...item, read: true })));
      toast.success("All notifications marked as read");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to mark all as read");
    }
  };

  const unreadCount = items.filter((n) => !n.read).length;

  return (
    <>
      <PageHeader
        title="Notifications"
        description={`${items.length} updates · ${unreadCount} unread`}
        action={
          <Button variant="outline" onClick={markAllRead} disabled={unreadCount === 0}>
            Mark all read
          </Button>
        }
      />
      <NotificationList items={items} onRead={markRead} />
    </>
  );
}
