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

const SYSTEM_HEALTH = [
  ["API Status", "Operational", "text-green-700"],
  ["AI Model", "Online", "text-green-700"],
  ["Storage Space", "62% used", "text-amber-700"],
  ["Pending Tasks", "12", "text-teal-700"],
];

const ACTIVITY = [
  "New user registration: Nimal P.",
  "PHI-203 completed 4 inspections",
  "Area flagged: Kaduwela",
  "Daily backup completed",
];

export default function Dashboard() {
  return (
    <>
      <PageHeader title="Admin Dashboard" description="System overview and current status." />
      
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard label="Total Users" value="1,248" icon={Users} tint="primary" />
        <StatCard label="Active PHIs" value="28" icon={UserCog} tint="primary" />
        <StatCard label="Total Reports" value="3,456" icon={FileText} tint="primary" />
        <StatCard label="High Risk Areas" value="6" icon={AlertTriangle} tint="destructive" />
        <StatCard label="Resolved Cases" value="2,911" icon={CheckCircle2} tint="success" />
        <StatCard label="Pending Review" value="45" icon={Activity} tint="warning" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="rounded border border-border bg-white p-5 shadow-sm">
          <h3 className="mb-4 text-sm font-semibold text-foreground">
            System Health
          </h3>
          <div className="space-y-4 text-sm">
            {SYSTEM_HEALTH.map(([label, value, tint]) => (
              <div key={label} className="flex items-center justify-between border-b border-border pb-2 last:border-0 last:pb-0">
                <span className="text-muted-foreground">{label}</span>
                <span className={`font-medium ${tint}`}>{value}</span>
              </div>
            ))}
          </div>
        </div>
        
        <div className="rounded border border-border bg-white p-5 shadow-sm">
          <h3 className="mb-4 text-sm font-semibold text-foreground">
            Recent System Activity
          </h3>
          <ul className="space-y-3 text-sm text-muted-foreground">
            {ACTIVITY.map((entry, index) => (
              <li key={index} className="flex gap-2">
                <span className="text-border">•</span> {entry}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  );
}
