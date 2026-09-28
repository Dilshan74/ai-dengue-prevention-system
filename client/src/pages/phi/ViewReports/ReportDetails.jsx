import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Check, MapPin, X, Loader2, Calendar, User, FileText, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import Badge from "../../../components/common/Badge";
import Button from "../../../components/common/Button";
import EmptyState from "../../../components/common/EmptyState";
import PageHeader from "../../../components/common/PageHeader";
import { PHI_REPORTS, RISK_TINT, STATUS_TINT } from "../../../utils/constants";
import phiService from "../../../services/phiService";

export default function ReportDetails() {
  const { id } = useParams();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    phiService
      .report(id)
      .then((data) => {
        setReport(data);
      })
      .catch((err) => {
        console.warn(`Could not load report ${id} from server:`, err);
        const cached = PHI_REPORTS.find((item) => item.id === id);
        setReport(cached || null);
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handleAction = async (nextStatus) => {
    try {
      setActionLoading(true);
      if (nextStatus === "Accepted") {
        await phiService.acceptReport(id);
        toast.success(`Report ${id} accepted`);
      } else if (nextStatus === "Rejected") {
        await phiService.rejectReport(id);
        toast.error(`Report ${id} rejected`);
      }
      setReport((prev) => (prev ? { ...prev, status: nextStatus } : prev));
    } catch (err) {
      toast.error(err.response?.data?.message || `Failed to update ${id}`);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

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

  const citizenName = report.citizenName || report.name || "Citizen";
  const formattedDate = report.date ? new Date(report.date).toLocaleString() : "Recently submitted";

  return (
    <>
      <PageHeader
        title={`Inspection Report: ${report.id}`}
        description={`${report.location} · Submitted by ${citizenName}`}
        action={
          <Button as={Link} to="/phi/reports" variant="outline">
            <ArrowLeft className="h-4 w-4" /> All reports
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
        {/* Left Column: Submitted Image */}
        <div className="space-y-4">
          <div className="soft-shadow rounded-2xl border border-border bg-card p-5">
            <h3 className="font-semibold text-foreground mb-3 flex items-center justify-between">
              <span>Site Photo &amp; Breeding Evidence</span>
              <Badge className={STATUS_TINT[report.status] || STATUS_TINT.Pending}>{report.status}</Badge>
            </h3>

            <div className="relative overflow-hidden rounded-xl border border-border bg-slate-950 aspect-[4/3] flex items-center justify-center">
              {report.image && (report.image.startsWith("/") || report.image.startsWith("http")) ? (
                <img
                  src={report.image}
                  alt={`Report ${report.id}`}
                  className="h-full w-full object-contain"
                />
              ) : (
                <div className="text-center p-6 text-muted-foreground">
                  <div className="text-4xl mb-2">{report.image || "🪣"}</div>
                  <span className="text-xs">No image file uploaded</span>
                </div>
              )}
            </div>

            {report.description && (
              <div className="mt-4 rounded-xl border border-border bg-muted/30 p-3 text-xs text-muted-foreground">
                <span className="font-semibold text-foreground block mb-1">Citizen Observation:</span>
                {report.description}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: AI Analysis & Actions */}
        <div className="space-y-6">
          <div className="soft-shadow rounded-2xl border border-border bg-card p-6">
            <h3 className="text-base font-semibold text-foreground mb-4 border-b border-border pb-3 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              AI Risk Assessment &amp; Metadata
            </h3>

            <div className="flex items-center gap-3 mb-4">
              <Badge className={RISK_TINT[report.risk] || RISK_TINT.Medium}>
                {report.risk} Risk Area
              </Badge>
              {report.phi && report.phi !== "—" && (
                <span className="text-xs text-muted-foreground">
                  Assigned PHI: <strong>{report.phi}</strong>
                </span>
              )}
            </div>

            <div className="space-y-3 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <User className="h-3.5 w-3.5 text-primary shrink-0" />
                <span>Submitted by: <strong className="text-foreground">{citizenName}</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-3.5 w-3.5 text-primary shrink-0" />
                <span>Date: <strong className="text-foreground">{formattedDate}</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
                <span>Location: <strong className="text-foreground">{report.location}</strong></span>
              </div>
              {report.lat && report.lng && (
                <div className="rounded-lg bg-muted/40 p-2 font-mono text-[11px] text-foreground">
                  📍 Coordinates: {report.lat.toFixed(4)}° N, {report.lng.toFixed(4)}° E
                </div>
              )}
            </div>
          </div>

          {/* Action Decision Card */}
          <div className="soft-shadow rounded-2xl border border-border bg-card p-6">
            <h3 className="text-base font-semibold text-foreground mb-3 border-b border-border pb-3">
              Inspection Action Decision
            </h3>
            <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
              Accept this report to schedule on-site larva inspection and vector control larviciding, or reject if identified as a false report.
            </p>

            <div className="flex flex-wrap gap-2">
              <Button
                disabled={actionLoading || report.status === "Accepted"}
                onClick={() => handleAction("Accepted")}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <Check className="h-4 w-4" /> Accept Inspection
              </Button>
              <Button
                variant="destructive"
                disabled={actionLoading || report.status === "Rejected"}
                onClick={() => handleAction("Rejected")}
              >
                <X className="h-4 w-4" /> Reject Report
              </Button>
              <Button as={Link} to="/phi/visits" variant="outline">
                <MapPin className="h-4 w-4" /> Plan Field Visit
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

