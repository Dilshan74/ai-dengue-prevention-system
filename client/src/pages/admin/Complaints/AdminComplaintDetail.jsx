import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft, CalendarClock, MapPin, RefreshCw,
  ShieldCheck, User, UserCheck, CheckCircle, X
} from "lucide-react";
import { toast } from "sonner";
import Badge from "../../../components/common/Badge";
import Button from "../../../components/common/Button";
import EmptyState from "../../../components/common/EmptyState";
import PageHeader from "../../../components/common/PageHeader";
import { FormField, Select } from "../../../components/common/Field";
import { STATUS_TINT, RISK_TINT, REPORT_STATUSES } from "../../../utils/constants";
import adminService from "../../../services/adminService";

function fmt(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleString("en-LK", {
    year: "numeric", month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export default function AdminComplaintDetail() {
  const { id } = useParams();
  const [report, setReport] = useState(null);
  const [phis, setPhis] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form state for the assign/status panel
  const [phiId, setPhiId] = useState("");
  const [newStatus, setNewStatus] = useState("");
  const [comments, setComments] = useState("");

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [rData, phiData] = await Promise.all([
        adminService.complaint(id),
        adminService.phis(),
      ]);
      setReport(rData);
      setPhis(Array.isArray(phiData) ? phiData : []);
      setPhiId(rData.phiId ?? "");
      setNewStatus(rData.status);
    } catch (err) {
      toast.error(err?.response?.data?.message ?? "Failed to load complaint");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleAssign = async () => {
    if (!phiId) { toast.error("Please select a PHI officer"); return; }
    try {
      setSaving(true);
      const updated = await adminService.assignPhi(id, phiId, newStatus, comments);
      setReport(updated);
      setComments("");
      toast.success("PHI assigned and status updated");
    } catch (err) {
      toast.error(err?.response?.data?.message ?? "Failed to assign PHI");
    } finally {
      setSaving(false);
    }
  };

  const handleStatusOnly = async () => {
    try {
      setSaving(true);
      const updated = await adminService.updateReportStatus(id, newStatus, comments);
      setReport(updated);
      setComments("");
      toast.success("Status updated");
    } catch (err) {
      toast.error(err?.response?.data?.message ?? "Failed to update status");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-muted-foreground">
        <RefreshCw className="mr-2 h-5 w-5 animate-spin" /> Loading…
      </div>
    );
  }

  if (!report) {
    return (
      <EmptyState
        title="Complaint not found"
        description={`No report matches ID: ${id}`}
        action={
          <Button as={Link} to="/admin/complaints" variant="outline">
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
        description={`${report.location} · by ${report.citizenName || "—"} · ${fmt(report.date)}`}
        action={
          <Button as={Link} to="/admin/complaints" variant="outline">
            <ArrowLeft className="h-4 w-4" /> All Complaints
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        {/* ── LEFT: Image + Description + Timeline ── */}
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
              <div className="flex items-center justify-center aspect-[4/3] bg-muted text-6xl">
                {report.image || "🪣"}
              </div>
            )}
          </div>

          {/* Description */}
          {report.description && (
            <div className="soft-shadow rounded-2xl border border-border bg-card p-6">
              <h3 className="mb-2 text-base font-semibold">Description</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{report.description}</p>
            </div>
          )}

          {/* History Timeline */}
          <div className="soft-shadow rounded-2xl border border-border bg-card p-6">
            <h3 className="mb-4 text-base font-semibold border-b border-border pb-3">
              Status History
            </h3>
            {report.history?.length > 0 ? (
              <ol className="relative border-l border-border ml-3 space-y-5">
                {[...report.history].reverse().map((step, i) => (
                  <li key={i} className="ml-5">
                    <span className="absolute -left-2.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 ring-2 ring-background">
                      <span className="h-2 w-2 rounded-full bg-primary" />
                    </span>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge className={STATUS_TINT[step.status] ?? "bg-muted text-muted-foreground"}>
                        {step.status}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{fmt(step.date)}</span>
                    </div>
                    {step.comments && (
                      <p className="mt-1 text-sm text-muted-foreground">{step.comments}</p>
                    )}
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-sm text-muted-foreground">No history yet.</p>
            )}
          </div>
        </div>

        {/* ── RIGHT: Details + Action Panel ── */}
        <div className="space-y-6">
          {/* Report Details Card */}
          <div className="soft-shadow rounded-2xl border border-border bg-card p-6">
            <div className="flex items-center justify-between mb-4 border-b border-border pb-3">
              <h3 className="text-base font-semibold">Report Details</h3>
              <Badge className={STATUS_TINT[report.status] ?? "bg-muted text-muted-foreground"}>
                {report.status}
              </Badge>
            </div>
            <div className="grid gap-4 text-sm">
              {[
                { icon: User, label: "Citizen", value: report.citizenName || "—" },
                { icon: MapPin, label: "Location", value: report.location },
                { icon: UserCheck, label: "Assigned PHI", value: report.phi && report.phi !== "—" ? report.phi : "Not assigned" },
                { icon: CalendarClock, label: "Submitted", value: fmt(report.date) },
                {
                  icon: ShieldCheck, label: "Risk Level",
                  value: (
                    <Badge className={RISK_TINT[report.risk] ?? "bg-muted text-muted-foreground"}>
                      {report.risk}
                    </Badge>
                  ),
                },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-start gap-3 border-b border-border pb-3 last:border-0 last:pb-0">
                  <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  <div className="min-w-0">
                    <div className="text-xs text-muted-foreground">{label}</div>
                    <div className="font-medium text-foreground">{value}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Action Panel ── */}
          <div className="soft-shadow rounded-2xl border border-primary/20 bg-primary/5 p-6">
            <h3 className="mb-4 text-base font-semibold border-b border-border pb-3">
              Assign PHI &amp; Update Status
            </h3>
            <div className="space-y-4">
              {/* PHI selector */}
              <FormField label="PHI Officer" htmlFor="acd-phi">
                <Select
                  id="acd-phi"
                  value={phiId}
                  onChange={(e) => setPhiId(e.target.value)}
                  className="h-10"
                  disabled={saving}
                >
                  <option value="">— Select PHI Officer —</option>
                  {phis.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}{p.area ? ` (${p.area})` : ""}
                    </option>
                  ))}
                </Select>
              </FormField>

              {/* Status selector */}
              <FormField label="Status" htmlFor="acd-status">
                <Select
                  id="acd-status"
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="h-10"
                  options={REPORT_STATUSES.map((s) => ({ value: s, label: s }))}
                  disabled={saving}
                />
              </FormField>

              {/* Comments */}
              <FormField label="Comment (optional)" htmlFor="acd-comments">
                <textarea
                  id="acd-comments"
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  placeholder="Add a note…"
                  disabled={saving}
                  className="h-16 w-full rounded border border-input bg-white p-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-none"
                />
              </FormField>

              {/* Buttons */}
              <div className="flex gap-2">
                <Button
                  className="flex-1"
                  onClick={handleAssign}
                  disabled={saving || !phiId}
                >
                  <UserCheck className="h-4 w-4" />
                  {saving ? "Saving…" : "Assign PHI"}
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={handleStatusOnly}
                  disabled={saving}
                >
                  <CheckCircle className="h-4 w-4" />
                  {saving ? "Saving…" : "Status Only"}
                </Button>
              </div>
            </div>
          </div>

          {/* Comments thread */}
          {report.comments?.length > 0 && (
            <div className="soft-shadow rounded-2xl border border-border bg-card p-6">
              <h3 className="mb-4 text-base font-semibold border-b border-border pb-3">Comments</h3>
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
        </div>
      </div>
    </>
  );
}
