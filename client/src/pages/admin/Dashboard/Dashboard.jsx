import { useEffect, useState } from "react";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  FileText,
  UserCog,
  Users,
} from "lucide-react";
import PageHeader from "../../../components/common/PageHeader";
import StatCard from "../../../components/common/StatCard";
import Card from "../../../components/common/Card";
import ReportGpsMap from "../../../components/maps/ReportGpsMap";
import adminService from "../../../services/adminService";

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dashboardError, setDashboardError] = useState("");
  const [activity, setActivity] = useState([]);
  const [systemHealth, setSystemHealth] = useState(null);
  const [healthLoading, setHealthLoading] = useState(true);

  useEffect(() => {
    adminService
      .dashboard()
      .then((data) => {
        if (data?.stats) setStats(data.stats);
        if (data?.recentReports) setActivity(data.recentReports);
      })
      .catch((error) => {
        console.error("Failed to load admin dashboard:", error);
        setDashboardError("Dashboard metrics could not be loaded. Please try again later.");
      })
      .finally(() => setLoading(false));

    adminService
      .systemHealth()
      .then(setSystemHealth)
      .catch((error) => {
        console.error("Failed to load system health:", error);
        setSystemHealth(null);
      })
      .finally(() => setHealthLoading(false));
  }, []);

  const s = stats ?? {
    totalUsers: 0,
    totalPhis: 0,
    totalReports: 0,
    highRiskReports: 0,
    resolvedReports: 0,
    pendingReports: 0,
  };

  return (
    <>
      <PageHeader title="Admin Dashboard" description="System overview and current status." />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard
          label="Total Users"
          value={loading || dashboardError ? "—" : s.totalUsers.toLocaleString()}
          icon={Users}
          tint="primary"
        />
        <StatCard
          label="Active PHIs"
          value={loading || dashboardError ? "—" : s.totalPhis}
          icon={UserCog}
          tint="primary"
        />
        <StatCard
          label="Total Reports"
          value={loading || dashboardError ? "—" : s.totalReports.toLocaleString()}
          icon={FileText}
          tint="primary"
        />
        <StatCard
          label="High Risk Reports"
          value={loading || dashboardError ? "—" : s.highRiskReports}
          icon={AlertTriangle}
          tint="destructive"
        />
        <StatCard
          label="Resolved Cases"
          value={loading || dashboardError ? "—" : s.resolvedReports.toLocaleString()}
          icon={CheckCircle2}
          tint="success"
        />
        <StatCard
          label="Pending Review"
          value={loading || dashboardError ? "—" : s.pendingReports}
          icon={Activity}
          tint="warning"
        />
      </div>
      {dashboardError && (
        <p role="alert" className="mt-3 text-sm text-destructive">
          {dashboardError}
        </p>
      )}

      <Card
        title="Citizen Report GPS Locations"
        description="Actual locations selected or detected when citizen reports were submitted. Updates every 30 seconds."
        className="mt-6"
      >
        <ReportGpsMap />
      </Card>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card title="System Health">
          <div className="space-y-4 text-sm">
            {[
              ["API", systemHealth?.api],
              ["Database", systemHealth?.database],
              [
                "AI Model",
                systemHealth?.aiModel?.status === "online" &&
                systemHealth.aiModel.riskModelLoaded === false
                  ? "degraded"
                  : systemHealth?.aiModel?.status,
              ],
            ].map(([label, status]) => {
              const value = healthLoading
                ? "Checking…"
                : status
                  ? status[0].toUpperCase() + status.slice(1)
                  : "Unavailable";
              const tint =
                status === "online"
                  ? "text-green-700"
                  : status === "degraded"
                    ? "text-amber-700"
                    : "text-red-700";

              return (
              <div
                key={label}
                className="flex items-center justify-between border-b border-border pb-2 last:border-0 last:pb-0"
              >
                <span className="text-muted-foreground">{label}</span>
                <span className={`font-medium ${tint}`}>{value}</span>
              </div>
              );
            })}
            {systemHealth?.aiModel?.riskModelLoaded === false && (
              <p className="text-xs text-amber-700">
                The AI service is online, but its risk model is not loaded.
              </p>
            )}
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
              <li className="text-muted-foreground">
                {loading ? "Loading recent reports…" : dashboardError ? "Recent activity is unavailable." : "No recent reports."}
              </li>
            )}
          </ul>
        </Card>
      </div>
    </>
  );
}
