import { useEffect, useState } from "react";
import { CheckCircle2, ClipboardCheck, Clock, FileText } from "lucide-react";
import PageHeader from "../../../components/common/PageHeader";
import StatCard from "../../../components/common/StatCard";
import Card from "../../../components/common/Card";
import DengueHotspotMap from "../../../components/maps/DengueHotspotMap";
import phiService from "../../../services/phiService";

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    phiService
      .dashboard()
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const stats = data?.stats ?? { assigned: 0, pending: 0, completed: 0, scheduledVisits: 0 };

  /** Convert reports from the dashboard response into the shape expected by DengueHotspotMap. */
  const mapReports =
    data?.recentReports?.filter((r) => r.lat != null && r.lng != null) ?? [];

  return (
    <>
      <PageHeader
        title="PHI Dashboard"
        description="Assigned reports and inspection workload."
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="New Reports"
          value={loading ? "—" : stats.assigned}
          icon={FileText}
          tint="primary"
        />
        <StatCard
          label="Pending Inspections"
          value={loading ? "—" : stats.pending}
          icon={Clock}
          tint="warning"
        />
        <StatCard
          label="Completed"
          value={loading ? "—" : stats.completed}
          icon={ClipboardCheck}
          tint="success"
        />
        <StatCard
          label="Scheduled Visits"
          value={loading ? "—" : stats.scheduledVisits}
          icon={CheckCircle2}
          tint="destructive"
        />
      </div>

      {/* Dengue Surveillance Map */}
      <Card
        title="Dengue Surveillance Map"
        description="Reported dengue locations assigned to you."
        className="mt-6"
      >
        <DengueHotspotMap
          reports={mapReports.length ? mapReports : undefined}
          compact
        />
      </Card>

      {/* Recent Activity */}
      <Card title="Recent Activity" className="mt-6">
        {data?.recentReports?.length ? (
          <ul className="space-y-3 text-sm text-muted-foreground">
            {data.recentReports.slice(0, 5).map((r) => (
              <li key={r.id} className="flex gap-2">
                <span className="text-border">•</span>
                {r.id} — {r.location} ({r.status})
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">No recent activity.</p>
        )}
      </Card>
    </>
  );
}
