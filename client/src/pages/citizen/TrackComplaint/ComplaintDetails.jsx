import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, CalendarClock, MapPin, RefreshCw, ShieldAlert, User, Cpu, FileText, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import Badge from "../../../components/common/Badge";
import Button from "../../../components/common/Button";
import EmptyState from "../../../components/common/EmptyState";
import PageHeader from "../../../components/common/PageHeader";
import BoundingBoxOverlay from "../../../components/BoundingBoxOverlay";
import { STATUS_TINT, RISK_TINT } from "../../../utils/constants";
import citizenService from "../../../services/citizenService";

function fmt(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleString("en-LK", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function ComplaintDetails() {
  const { id } = useParams();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        setLoading(true);
        const data = await citizenService.complaint(id);
        if (active) setReport(data);
      } catch (err) {
        toast.error(err?.response?.data?.message ?? "Failed to load complaint dossier");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-muted-foreground font-mono text-xs">
        <RefreshCw className="mr-2 h-4 w-4 animate-spin text-teal-600 dark:text-teal-400" />
        LOADING SURVEILLANCE DOSSIER // {id}...
      </div>
    );
  }

  if (!report) {
    return (
      <EmptyState
        title="Surveillance Record Not Found"
        description={`No incident dossier matches report identifier ${id}.`}
        action={
          <Button as={Link} to="/citizen/track" variant="outline" className="font-mono text-xs">
            RETURN TO REGISTRY
          </Button>
        }
      />
    );
  }

  const detailRows = [
    { icon: MapPin, label: "Sector / Location", value: report.location },
    { icon: User, label: "Assigned PHI Officer", value: report.phi || "Unassigned (Queued)" },
    { icon: CalendarClock, label: "Registered At", value: fmt(report.date || report.updated) },
    {
      icon: ShieldAlert,
      label: "Epidemiological Risk",
      value: (
        <Badge className={`font-mono text-[11px] uppercase ${RISK_TINT[report.risk] ?? "bg-muted text-muted-foreground"}`}>
          {report.risk ?? "Medium"} RISK ({report.riskScore || 65}/100)
        </Badge>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title={`Incident Dossier: ${report.id}`}
        description={`Geospatial Sector: ${report.location} · Registered ${fmt(report.date || report.updated)}`}
        action={
          <Button as={Link} to="/citizen/track" variant="outline" className="font-mono text-xs">
            <ArrowLeft className="h-3.5 w-3.5 mr-1" /> ALL INCIDENTS
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        {/* Left Column: Visual Media & Telemetry */}
        <div className="space-y-4">
          {/* Media Inspector Preview */}
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-center justify-between mb-3 border-b border-border/80 pb-2 font-mono text-xs">
              <span className="font-semibold text-foreground uppercase tracking-wider">
                EVIDENCE MEDIA INSPECTION
              </span>
              <span className="text-muted-foreground text-[11px]">
                {report.predictions?.length || 0} TARGET CUE(S)
              </span>
            </div>

            <div className="overflow-hidden rounded border border-slate-800 bg-slate-950">
              <BoundingBoxOverlay
                imageUrl={report.images?.[0] || report.image}
                predictions={report.predictions || []}
              />
            </div>
          </div>

          {/* Incident Description */}
          {report.description && (
            <div className="rounded-lg border border-border bg-card p-5">
              <h3 className="mb-2 text-xs font-mono font-semibold uppercase tracking-wider text-foreground">
                SURVEILLANCE OBSERVATION NOTES
              </h3>
              <p className="text-xs text-muted-foreground font-sans leading-relaxed">
                {report.description}
              </p>
            </div>
          )}

          {/* Status History & Audit Log */}
          <div className="rounded-lg border border-border bg-card p-5">
            <h3 className="mb-3 text-xs font-mono font-semibold uppercase tracking-wider text-foreground border-b border-border/80 pb-2">
              DISPOSITION AUDIT LOG
            </h3>
            {report.history?.length > 0 ? (
              <ol className="relative border-l border-border ml-2 space-y-4 pt-1">
                {[...report.history].reverse().map((step, index) => (
                  <li key={index} className="ml-4">
                    <span className="absolute -left-1.5 flex h-3 w-3 items-center justify-center rounded-full bg-teal-500 ring-4 ring-background" />
                    <div className="flex items-center gap-2 flex-wrap font-mono">
                      <Badge className={`text-[10px] uppercase ${STATUS_TINT[step.status] ?? "bg-muted text-muted-foreground"}`}>
                        {step.status}
                      </Badge>
                      <span className="text-[11px] text-muted-foreground">
                        {fmt(step.date)}
                      </span>
                    </div>
                    {step.comments && (
                      <p className="mt-1 text-xs text-muted-foreground font-sans">{step.comments}</p>
                    )}
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-xs text-muted-foreground font-mono">No historical audit entries yet.</p>
            )}
          </div>
        </div>

        {/* Right Column: Parameters & PHI Assignment */}
        <div className="space-y-4">
          {/* Status & Telemetry Card */}
          <div className="rounded-lg border border-border bg-card p-5 font-mono">
            <div className="flex items-center justify-between mb-4 border-b border-border/80 pb-3">
              <div>
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold block">CURRENT STATUS</span>
                <span className="text-sm font-bold text-foreground">{report.status}</span>
              </div>
              <Badge className={`text-xs uppercase ${STATUS_TINT[report.status] ?? "bg-muted text-muted-foreground"}`}>
                {report.status}
              </Badge>
            </div>

            <div className="space-y-3 text-xs">
              {detailRows.map(({ icon: Icon, label, value }) => (
                <div
                  key={label}
                  className="flex items-start gap-2.5 border-b border-border/60 pb-2.5 last:border-0 last:pb-0"
                >
                  <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-teal-600 dark:text-teal-400" />
                  <div className="min-w-0 flex-1">
                    <div className="text-[11px] text-muted-foreground">{label}</div>
                    <div className="font-semibold text-foreground mt-0.5">{value}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Field PHI Comments */}
          {report.comments?.length > 0 && (
            <div className="rounded-lg border border-border bg-card p-5">
              <h3 className="mb-3 text-xs font-mono font-semibold uppercase tracking-wider text-foreground border-b border-border/80 pb-2">
                INSPECTOR FIELD NOTES
              </h3>
              <ul className="space-y-2.5">
                {report.comments.map((c, i) => (
                  <li key={i} className="rounded border border-border bg-muted/20 p-3 text-xs font-mono">
                    <div className="flex items-center justify-between mb-1 text-[11px]">
                      <span className="font-bold text-foreground">{c.userName || "Public Health Inspector"}</span>
                      <span className="text-muted-foreground">{fmt(c.date)}</span>
                    </div>
                    <p className="text-muted-foreground font-sans text-xs">{c.comment}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Quick Actions */}
          <div className="rounded-lg border border-border bg-card p-4 space-y-2 font-mono text-xs">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold block mb-1">
              SURVEILLANCE ACTIONS
            </span>
            <Button 
              variant="outline" 
              className="w-full text-xs font-mono justify-start h-8"
              onClick={() => window.print()}
            >
              <FileText className="h-3.5 w-3.5 mr-2 text-teal-600 dark:text-teal-400" />
              EXPORT SURVEILLANCE DOSSIER (PDF)
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
