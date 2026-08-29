import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  Brain,
  CheckCircle2,
  FileText,
  UserCog,
  Users,
} from "lucide-react";
import PageHeader from "../../../components/common/PageHeader";
import StatCard from "../../../components/common/StatCard";
import Card from "../../../components/common/Card";
import DengueHotspotMap from "../../../components/maps/DengueHotspotMap";
import adminService from "../../../services/adminService";
import { cn } from "../../../utils/helpers";

const MAP_FILTERS = [
  { label: "All", value: {} },
  { label: "High Risk", value: { risk: "High" } },
  { label: "Pending", value: { status: "Pending" } },
  { label: "Resolved", value: { status: "Resolved" } },
  { label: "Under Review", value: { status: "Under Review" } },
];

const SYSTEM_HEALTH = [
  ["API Status", "Operational", "text-green-700"],
  ["AI Model", "Online", "text-green-700"],
  ["Storage Space", "62% used", "text-amber-700"],
  ["Pending Tasks", "12", "text-teal-700"],
];

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activity, setActivity] = useState([]);
  const [activeFilter, setActiveFilter] = useState(0);

  useEffect(() => {
    adminService
      .dashboard()
      .then((data) => {
        if (data?.stats) setStats(data.stats);
        if (data?.recentReports) setActivity(data.recentReports);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const s = stats ?? {
    totalUsers: 0,
    totalPhis: 0,
    totalReports: 0,
    highRiskReports: 0,
    resolvedReports: 0,
    pendingReports: 0,
  };

  const mapFilter = useMemo(() => MAP_FILTERS[activeFilter].value, [activeFilter]);

  return (
    <>
      <PageHeader title="Admin Dashboard" description="System overview and current status." />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard
          label="Total Users"
          value={loading ? "—" : s.totalUsers.toLocaleString()}
          icon={Users}
          tint="primary"
        />
        <StatCard
          label="Active PHIs"
          value={loading ? "—" : s.totalPhis}
          icon={UserCog}
          tint="primary"
        />
        <StatCard
          label="Total Reports"
          value={loading ? "—" : s.totalReports.toLocaleString()}
          icon={FileText}
          tint="primary"
        />
        <StatCard
          label="High Risk Areas"
          value={loading ? "—" : s.highRiskReports}
          icon={AlertTriangle}
          tint="destructive"
        />
        <StatCard
          label="Resolved Cases"
          value={loading ? "—" : s.resolvedReports.toLocaleString()}
          icon={CheckCircle2}
          tint="success"
        />
        <StatCard
          label="Pending Review"
          value={loading ? "—" : s.pendingReports}
          icon={Activity}
          tint="warning"
        />
      </div>

      {/* Dengue Monitoring Map */}
      <Card
        title="Dengue Monitoring Map"
        description="All reported dengue locations across Sri Lanka."
        className="mt-6"
        action={
          <div className="flex flex-wrap gap-1.5">
            {MAP_FILTERS.map((f, i) => (
              <button
                key={f.label}
                type="button"
                onClick={() => setActiveFilter(i)}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                  i === activeFilter
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
        }
      >
        <DengueHotspotMap filter={mapFilter} />
      </Card>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card title="System Health">
          <div className="space-y-4 text-sm">
            {SYSTEM_HEALTH.map(([label, value, tint]) => (
              <div
                key={label}
                className="flex items-center justify-between border-b border-border pb-2 last:border-0 last:pb-0"
              >
                <span className="text-muted-foreground">{label}</span>
                <span className={`font-medium ${tint}`}>{value}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Recent System Activity">
          <ul className="space-y-3 text-sm text-muted-foreground">
            {activity.length ? (
              activity.slice(0, 5).map((r) => (
                <li key={r.id || r._id} className="flex gap-2">
                  <span className="text-border">•</span>
                  {r.id} — {r.location} ({r.status})
                </li>
              ))
            ) : (
              <>
                <li className="flex gap-2"><span className="text-border">•</span> System is operational</li>
              </>
            )}
          </ul>
        </Card>
      </div>
    </>
  );
}
