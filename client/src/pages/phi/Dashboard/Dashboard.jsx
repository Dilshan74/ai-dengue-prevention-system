import { CheckCircle2, ClipboardCheck, Clock, FileText } from "lucide-react";
import PageHeader from "../../../components/common/PageHeader";
import StatCard from "../../../components/common/StatCard";

export default function Dashboard() {
  return (
    <>
      <PageHeader
        title="PHI Dashboard"
        description="Assigned reports and inspection workload."
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="New Reports" value={4} icon={FileText} tint="primary" />
        <StatCard label="Pending Inspections" value={6} icon={Clock} tint="warning" />
        <StatCard label="Completed" value={12} icon={ClipboardCheck} tint="success" />
        <StatCard label="Verified High Risk" value={2} icon={CheckCircle2} tint="destructive" />
      </div>

      <div className="mt-6 rounded border border-border bg-white p-5 shadow-sm">
        <h3 className="mb-4 border-b border-border pb-3 text-sm font-semibold text-foreground">
          Recent Activity
        </h3>
        <ul className="space-y-3 text-sm text-muted-foreground">
          <li>• Inspected location: Kaduwela Ward 3</li>
          <li>• Verified report: ST-2034</li>
          <li>• Assigned 2 new reports for review</li>
        </ul>
      </div>
    </>
  );
}
