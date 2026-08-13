import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Check, MapPin, X } from "lucide-react";
import { toast } from "sonner";
import Badge from "../../../components/common/Badge";
import Button from "../../../components/common/Button";
import EmptyState from "../../../components/common/EmptyState";
import PageHeader from "../../../components/common/PageHeader";
import {
  PHI_REPORTS,
} from "../../../utils/constants";

const DETECTED_FACTORS = [
  "Stagnant water in container",
  "No cover on bucket",
];

export default function ReportDetails() {
  const { id } = useParams();
  const report = PHI_REPORTS.find((item) => item.id === id);
  const [, setStatus] = useState(report?.status);

  if (!report) {
    return (
      <EmptyState
        title="Report not found"
        description={`No report matches ${id}.`}
        action={
          <Button as={Link} to="/phi/reports" variant="outline">
            Back to reports
          </Button>
        }
      />
    );
  }

  return (
    <>
      <PageHeader
        title={`Report ${report.id}`}
        description={`${report.location} · submitted by ${report.name}`}
        action={
          <Button as={Link} to="/phi/reports" variant="outline">
            <ArrowLeft className="h-4 w-4" /> All reports
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
        <div className="rounded border border-border bg-slate-100 flex items-center justify-center p-8 aspect-[4/3]">
           <span className="text-muted-foreground text-sm">[ Image of suspected site ]</span>
        </div>

        <div className="space-y-6">
          <div className="rounded border border-border bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-lg font-semibold border-b border-border pb-3">AI Detection Results</h3>
            <div className="flex gap-2 mb-4">
               <Badge variant={report.risk === "High" ? "destructive" : "warning"}>{report.risk} Risk</Badge>
               <Badge variant="default">Confidence: 87%</Badge>
            </div>
            <div>
              <span className="text-muted-foreground block mb-2 text-sm">Detected Risk Factors</span>
              <ul className="list-disc pl-4 text-sm text-foreground">
                {DETECTED_FACTORS.map(factor => <li key={factor}>{factor}</li>)}
              </ul>
            </div>
          </div>

          <div className="rounded border border-border bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-lg font-semibold border-b border-border pb-3">Actions</h3>
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={() => {
                  setStatus("Accepted");
                  toast.success(`${report.id} accepted`);
                }}
              >
                <Check className="h-4 w-4" /> Accept
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  setStatus("Rejected");
                  toast.error(`${report.id} rejected`);
                }}
              >
                <X className="h-4 w-4" /> Reject
              </Button>
              <Button as={Link} to="/phi/visits" variant="outline">
                <MapPin className="h-4 w-4" /> Plan visit
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
