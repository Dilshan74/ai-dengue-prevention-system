import { Link } from "react-router-dom";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Cloud,
  Droplets,
  FileText,
  MapPinned,
  ThermometerSun,
  Upload,
} from "lucide-react";
import Badge from "../../../components/common/Badge";
import Button from "../../../components/common/Button";
import PageHeader from "../../../components/common/PageHeader";
import StatCard from "../../../components/common/StatCard";
import useNotification from "../../../hooks/useNotification";
import {
  CITIZEN_REPORTS,
  PREVENTION_TIPS,
  STATUS_TINT,
  WEATHER,
} from "../../../utils/constants";

export default function Dashboard() {
  const { items: notifications } = useNotification();

  return (
    <>
      <PageHeader
        title="Citizen Dashboard"
        description="Report breeding sites and track local dengue risks."
        action={
          <div className="flex gap-2">
            <Button as={Link} to="/citizen/map" variant="outline">
              <MapPinned className="h-4 w-4" /> Risk Map
            </Button>
            <Button as={Link} to="/citizen/upload">
              <Upload className="h-4 w-4" /> New Report
            </Button>
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="My Reports" value={3} icon={FileText} tint="primary" />
        <StatCard label="Pending" value={1} icon={Clock} tint="warning" />
        <StatCard label="Resolved" value={2} icon={CheckCircle2} tint="success" />
        <StatCard label="Local Risk" value="Low" icon={AlertTriangle} tint="primary" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="rounded border border-border bg-white p-5 shadow-sm lg:col-span-2">
          <div className="mb-4 flex items-center justify-between border-b border-border pb-3">
            <h3 className="text-sm font-semibold text-foreground">My Recent Reports</h3>
            <Link to="/citizen/track" className="text-xs font-medium text-primary hover:underline">
              View all
            </Link>
          </div>
          <div className="space-y-3">
            {CITIZEN_REPORTS.slice(0, 3).map((report) => (
              <Link
                key={report.id}
                to={`/citizen/track/${report.id}`}
                className="flex items-center gap-3 rounded border border-border bg-slate-50 p-3 hover:bg-slate-100"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <span>{report.id}</span>
                    <Badge variant={report.status === "Pending" ? "warning" : "success"}>
                      {report.status}
                    </Badge>
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {report.location} • {report.date}
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">{report.updated}</div>
              </Link>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded border border-border bg-white p-5 shadow-sm">
            <div className="mb-4 border-b border-border pb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">Local Weather</h3>
              <Cloud className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="flex items-end gap-3">
              <div className="text-3xl font-bold text-foreground">{WEATHER.temp}°</div>
              <div className="pb-1 text-sm text-muted-foreground">
                <div>{WEATHER.condition}</div>
                <div>{WEATHER.city}</div>
              </div>
            </div>
          </div>

          <div className="rounded border border-border bg-white p-5 shadow-sm">
            <div className="mb-4 border-b border-border pb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">Notifications</h3>
              <Link to="/citizen/notifications" className="text-xs font-medium text-primary hover:underline">
                All
              </Link>
            </div>
            <div className="space-y-3">
              {notifications.slice(0, 3).map((notification) => (
                <div key={notification.id} className="text-sm">
                  <div className="font-medium text-foreground">{notification.title}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{notification.body}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 rounded border border-border bg-white p-5 shadow-sm">
        <h3 className="mb-4 border-b border-border pb-3 text-sm font-semibold text-foreground">
          Prevention Tips
        </h3>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 text-sm text-muted-foreground list-disc pl-4">
          {PREVENTION_TIPS.map((tip, index) => (
            <li key={index}>{tip}</li>
          ))}
        </ul>
      </div>
    </>
  );
}
