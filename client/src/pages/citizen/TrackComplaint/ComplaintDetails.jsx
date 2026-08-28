import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, CalendarClock, MapPin, RefreshCw, ShieldCheck, User } from "lucide-react";
import { toast } from "sonner";
import Badge from "../../../components/common/Badge";
import Button from "../../../components/common/Button";
import EmptyState from "../../../components/common/EmptyState";
import PageHeader from "../../../components/common/PageHeader";
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
        toast.error(err?.response?.data?.message ?? "Failed to load complaint");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-muted-foreground">
        <RefreshCw className="mr-2 h-5 w-5 animate-spin" /> Loading complaint…
      </div>
    );
  }

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

  const detailRows = [
    { icon: MapPin, label: "Location", value: report.location },
    { icon: User, label: "Assigned PHI", value: report.phi || "Not yet assigned" },
    { icon: CalendarClock, label: "Submitted", value: fmt(report.date) },
    {
      icon: ShieldCheck,
      label: "Risk level",
      value: (
        <Badge className={RISK_TINT[report.risk] ?? "bg-muted text-muted-foreground"}>
          {report.risk ?? "—"}
        </Badge>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title={`Complaint ${report.id}`}
        description={`${report.location} · submitted ${fmt(report.date)}`}
        action={
          <Button as={Link} to="/citizen/track" variant="outline">
            <ArrowLeft className="h-4 w-4" /> All complaints
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        {/* Left column */}
        <div className="space-y-6">
          {/* Image */}
          <div className="soft-shadow rounded-2xl border border-border bg-card overflow-hidden">
            {report.images?.[0] ? (
              <img
                src={report.images[0]}
                alt="Reported site"
                className="w-full aspect-[4/3] object-cover"
              />
            ) : (
              <div className="flex items-center justify-center aspect-[4/3] bg-muted text-5xl">
                {report.image || "🪣"}
              </div>
            )}
          </div>

          {/* Description */}
          {report.description && (
            <div className="soft-shadow rounded-2xl border border-border bg-card p-6">
              <h3 className="mb-3 text-base font-semibold">Description</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {report.description}
              </p>
            </div>
          )}

          {/* Status History Timeline */}
          <div className="soft-shadow rounded-2xl border border-border bg-card p-6">
            <h3 className="mb-4 text-base font-semibold border-b border-border pb-3">
              Progress Timeline
            </h3>
            {report.history?.length > 0 ? (
              <ol className="relative border-l border-border ml-3 space-y-5">
                {[...report.history].reverse().map((step, index) => (
                  <li key={index} className="ml-5">
                    <span className="absolute -left-2.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 ring-2 ring-background">
                      <span className="h-2 w-2 rounded-full bg-primary" />
                    </span>
                    <div className="flex items-start gap-2 flex-wrap">
                      <Badge className={STATUS_TINT[step.status] ?? "bg-muted text-muted-foreground"}>
                        {step.status}
                      </Badge>
                      <span className="text-xs text-muted-foreground mt-0.5">
                        {fmt(step.date)}
                      </span>
                    </div>
                    {step.comments && (
                      <p className="mt-1 text-sm text-muted-foreground">{step.comments}</p>
                    )}
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-sm text-muted-foreground">No history available yet.</p>
            )}
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Status Card */}
          <div className="soft-shadow rounded-2xl border border-border bg-card p-6">
            <div className="flex items-center justify-between mb-4 border-b border-border pb-3">
              <h3 className="text-base font-semibold">Current Status</h3>
              <Badge className={STATUS_TINT[report.status] ?? "bg-muted text-muted-foreground"}>
                {report.status}
              </Badge>
            </div>
            <div className="grid gap-4 text-sm">
              {detailRows.map(({ icon: Icon, label, value }) => (
                <div
                  key={label}
                  className="flex items-start gap-3 border-b border-border pb-3 last:border-0 last:pb-0"
                >
                  <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  <div className="min-w-0">
                    <div className="text-xs text-muted-foreground">{label}</div>
                    <div className="font-medium text-foreground">{value}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Comments */}
          {report.comments?.length > 0 && (
            <div className="soft-shadow rounded-2xl border border-border bg-card p-6">
              <h3 className="mb-4 text-base font-semibold border-b border-border pb-3">
                Comments
              </h3>
              <ul className="space-y-3">
                {report.comments.map((c, i) => (
                  <li key={i} className="rounded-lg bg-muted/40 p-3 text-sm">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium">{c.userName || "Staff"}</span>
                      <span className="text-xs text-muted-foreground">{fmt(c.date)}</span>
                    </div>
                    <p className="text-muted-foreground">{c.comment}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Address */}
          {report.address && report.address !== report.location && (
            <div className="soft-shadow rounded-2xl border border-border bg-card p-6">
              <h3 className="mb-2 text-base font-semibold">Full Address</h3>
              <p className="text-sm text-muted-foreground">{report.address}</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
