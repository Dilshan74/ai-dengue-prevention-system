import { useEffect } from "react";
import Button from "../../../components/common/Button";
import PageHeader from "../../../components/common/PageHeader";
import NotificationList from "../../../components/notifications/NotificationList";
import useNotification from "../../../hooks/useNotification";

export default function Notifications() {
  const { items, unreadCount, markRead, markAllRead, refresh } = useNotification();

  useEffect(() => {
    refresh?.();
  }, [refresh]);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <PageHeader
        title="Notifications"
        description={`${items.length} total updates · ${unreadCount} unread`}
        action={
          <Button
            variant="outline"
            size="sm"
            onClick={markAllRead}
            disabled={unreadCount === 0}
            className="text-xs rounded-xl"
          >
            Mark all read
          </Button>
        }
      />
      <NotificationList items={items} onRead={markRead} />
    </div>
  );
}
