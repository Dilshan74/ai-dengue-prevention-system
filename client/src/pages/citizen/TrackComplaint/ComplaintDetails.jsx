import { Link, useParams } from "react-router-dom";
import { ArrowLeft, CalendarClock, MapPin, ShieldCheck, User } from "lucide-react";
import Badge from "../../../components/common/Badge";
import Button from "../../../components/common/Button";
import EmptyState from "../../../components/common/EmptyState";
import PageHeader from "../../../components/common/PageHeader";
import {
  CITIZEN_REPORTS,
} from "../../../utils/constants";

const TIMELINE = [
  { label: "Report submitted", detail: "Photo uploaded and queued for AI analysis." },
  { label: "AI analysis completed", detail: "Classified as a breeding site with 92% confidence." },
  { label: "Assigned to PHI", detail: "Routed to the inspector responsible for the ward." },
  { label: "Inspection", detail: "Site visit scheduled and findings recorded." },
];

const DETECTED_FACTORS = [
  "Stagnant water in container",
  "No cover on bucket",
];

export default function ComplaintDetails() {
  const { id } = useParams();
  const report = CITIZEN_REPORTS.find((item) => item.id === id);

  if (!report) {
    return (
      <EmptyState
        title="Complaint not found"
        description={`No report matches ${id}.`}
        action={
          <Button as={Link} to="/citizen/track" variant="outline">
            Back to complaints
          </Button>
        }
      />
    );
  }

  return (
    <>
      <PageHeader
        title={`Complaint ${report.id}`}
        description={`${report.location} · submitted ${report.date}`}
        action={
          <Button as={Link} to="/citizen/track" variant="outline">
            <ArrowLeft className="h-4 w-4" /> All complaints
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <div className="space-y-6">
          <div className="rounded border border-border bg-slate-100 flex items-center justify-center p-8 aspect-[4/3]">
             <span className="text-muted-foreground text-sm">[ Image of suspected site ]</span>
          </div>

          <div className="rounded border border-border bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-lg font-semibold border-b border-border pb-3">Progress</h3>
            <ol className="space-y-4">
              {TIMELINE.map((step, index) => (
                <li key={step.label} className="flex gap-3">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-teal-100 text-xs font-bold text-teal-700">
                    {index + 1}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-foreground">{step.label}</div>
                    <p className="text-sm text-muted-foreground mt-0.5">{step.detail}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded border border-border bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-lg font-semibold border-b border-border pb-3">Details</h3>
            <div className="grid gap-3 text-sm">
              {[
                { icon: MapPin, label: "Location", value: report.location },
                { icon: User, label: "Assigned PHI", value: report.phi },
                { icon: CalendarClock, label: "Submitted", value: report.date },
                { icon: ShieldCheck, label: "Risk level", value: report.risk },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-start gap-3 border-b border-border pb-2 last:border-0 last:pb-0">
                  <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  <div className="min-w-0">
                    <div className="text-xs text-muted-foreground">{label}</div>
                    <div className="truncate font-medium text-foreground">{value}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded border border-border bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-lg font-semibold border-b border-border pb-3">AI Analysis Results</h3>
            <div>
              <span className="text-muted-foreground block mb-2 text-sm">Detected Risk Factors</span>
              <ul className="list-disc pl-4 text-sm text-foreground">
                {DETECTED_FACTORS.map(factor => <li key={factor}>{factor}</li>)}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
