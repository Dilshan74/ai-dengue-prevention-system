import { useEffect, useState } from "react";
import {
  Bell,
  Camera,
  FileBarChart,
  FileSearch,
  LayoutDashboard,
  MapPin,
  Sparkles,
  User,
} from "lucide-react";
import DashboardLayout from "./DashboardLayout";
import phiService from "../services/phiService";
import notificationService from "../services/notificationService";

const baseItems = [
  { to: "/phi", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/phi/reports", label: "View Reports", icon: FileSearch },
  { to: "/phi/prediction", label: "AI Prediction", icon: Sparkles },
  { to: "/phi/visits", label: "Visit Locations", icon: MapPin },
  { to: "/phi/photos", label: "Inspection Photos", icon: Camera },
  { to: "/phi/generate", label: "Generate Reports", icon: FileBarChart },
  { to: "/phi/notifications", label: "Notifications", icon: Bell },
  { to: "/phi/profile", label: "Profile", icon: User },
];

export default function PHILayout() {
  const [stats, setStats] = useState(null);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  useEffect(() => {
    phiService
      .dashboard()
      .then((res) => {
        if (res?.stats) setStats(res.stats);
      })
      .catch(() => {});

    notificationService
      .unreadCount()
      .then((res) => {
        if (res?.count != null) setUnreadNotifications(res.count);
      })
      .catch(() => {});
  }, []);

  const navItems = baseItems.map((item) => {
    if (item.to === "/phi/reports" && stats?.pending > 0) {
      return { ...item, badge: stats.pending };
    }
    if (item.to === "/phi/visits" && stats?.scheduledVisits > 0) {
      return { ...item, badge: stats.scheduledVisits };
    }
    if (item.to === "/phi/notifications" && unreadNotifications > 0) {
      return { ...item, badge: unreadNotifications };
    }
    return item;
  });

  return (
    <DashboardLayout
      role="phi"
      items={navItems}
      title="PHI Console"
      subtitle="Verify. Inspect. Escalate."
    />
  );
}
