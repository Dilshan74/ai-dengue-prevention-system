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

  // Dynamic notification counter: only increments (1, 2, 3...) when new unread notifications arrive
  const navItems = baseItems.map((item) => {
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
