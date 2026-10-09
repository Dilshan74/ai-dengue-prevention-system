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
import useNotification from "../hooks/useNotification";
import phiService from "../services/phiService";

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
  const { unreadCount } = useNotification();
  const [pendingReportsCount, setPendingReportsCount] = useState(0);

  const fetchStats = () => {
    phiService
      .reports({ status: "Pending", pageSize: 100 })
      .then((res) => {
        const items = res?.data || res?.items || (Array.isArray(res) ? res : []);
        setPendingReportsCount(items.length);
      })
      .catch(() => {});
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 10000);
    return () => clearInterval(interval);
  }, []);

  const navItems = baseItems.map((item) => {
    // Show count of reports requiring review
    if (item.to === "/phi/reports" && pendingReportsCount > 0) {
      return { ...item, badge: pendingReportsCount };
    }
    // Show unread notifications count
    if (item.to === "/phi/notifications" && unreadCount > 0) {
      return { ...item, badge: unreadCount };
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
