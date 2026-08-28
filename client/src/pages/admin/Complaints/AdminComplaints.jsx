import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Eye, RefreshCw, UserCheck, X, CheckCircle,
  ClipboardList, AlertCircle
} from "lucide-react";
import { toast } from "sonner";
import Badge from "../../../components/common/Badge";
import Button from "../../../components/common/Button";
import EmptyState from "../../../components/common/EmptyState";
import PageHeader from "../../../components/common/PageHeader";
import Pagination from "../../../components/common/Pagination";
import SearchBar from "../../../components/common/SearchBar";
import Table from "../../../components/common/Table";
import { FormField, Select } from "../../../components/common/Field";
import { STATUS_TINT, RISK_TINT, REPORT_STATUSES } from "../../../utils/constants";
import { paginate, totalPages } from "../../../utils/helpers";
import adminService from "../../../services/adminService";

const PER_PAGE = 8;

function fmt(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toISOString().slice(0, 10);
}

function timeAgo(dateStr) {
  if (!dateStr) return "—";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return `${Math.floor(days / 7)}w ago`;
}

// ── Assign PHI Modal ────────────────────────────────────────────────────────
function AssignModal({ report, phis, onClose, onSaved }) {
  const [phiId, setPhiId] = useState(report.phiId ?? "");
  const [status, setStatus] = useState(report.status);
  const [comments, setComments] = useState("");
  const [loading, setLoading] = useState(false);

  const save = async () => {
    if (!phiId) {
      toast.error("Please select a PHI officer");
      return;
    }
    try {
      setLoading(true);
      const updated = await adminService.assignPhi(report.id, phiId, status, comments);
      toast.success(`PHI assigned to ${report.id}`);
      onSaved(updated);
      onClose();
    } catch (err) {
      toast.error(err?.response?.data?.message ?? "Failed to assign PHI");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-md rounded-2xl bg-card border border-border shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div>
            <h2 className="text-base font-semibold">Assign PHI Officer</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Report {report.id} · {report.location}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          {/* Current info */}
          <div className="rounded-xl bg-muted/40 p-3 text-sm space-y-1">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Citizen</span>
              <span className="font-medium">{report.citizenName || "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Current Status</span>
              <Badge className={STATUS_TINT[report.status] ?? "bg-muted text-muted-foreground"}>
                {report.status}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Risk</span>
              <Badge className={RISK_TINT[report.risk] ?? "bg-muted text-muted-foreground"}>
                {report.risk}
              </Badge>
            </div>
          </div>

          {/* PHI Selector */}
          <FormField label="Assign PHI Officer" htmlFor="am-phi">
            <Select
              id="am-phi"
              value={phiId}
              onChange={(e) => setPhiId(e.target.value)}
              className="h-10"
            >
              <option value="">— Select PHI Officer —</option>
              {phis.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}{p.area ? ` (${p.area})` : ""}
                </option>
              ))}
            </Select>
          </FormField>

          {/* Status Selector */}
          <FormField label="Update Status" htmlFor="am-status">
            <Select
              id="am-status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="h-10"
              options={REPORT_STATUSES.map((s) => ({ value: s, label: s }))}
            />
          </FormField>

          {/* Comments */}
          <FormField label="Comments (optional)" htmlFor="am-comments">
            <textarea
              id="am-comments"
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="Add a note for the PHI officer…"
              className="h-20 w-full rounded border border-input bg-white p-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-none"
            />
          </FormField>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 border-t border-border px-6 py-4">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={save} disabled={loading}>
            <UserCheck className="h-4 w-4" />
            {loading ? "Saving…" : "Assign & Update"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Status-only Update Modal ────────────────────────────────────────────────
function StatusModal({ report, onClose, onSaved }) {
  const [status, setStatus] = useState(report.status);
  const [comments, setComments] = useState("");
  const [loading, setLoading] = useState(false);

  const save = async () => {
    try {
      setLoading(true);
      const updated = await adminService.updateReportStatus(report.id, status, comments);
      toast.success("Status updated");
      onSaved(updated);
      onClose();
    } catch (err) {
      toast.error(err?.response?.data?.message ?? "Failed to update status");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-sm rounded-2xl bg-card border border-border shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="text-base font-semibold">Update Status</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <p className="text-sm text-muted-foreground">Report <strong>{report.id}</strong></p>
          <FormField label="New Status" htmlFor="sm-status">
            <Select
              id="sm-status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="h-10"
              options={REPORT_STATUSES.map((s) => ({ value: s, label: s }))}
            />
          </FormField>
          <FormField label="Comment (optional)" htmlFor="sm-comments">
            <textarea
              id="sm-comments"
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="Reason for status change…"
              className="h-16 w-full rounded border border-input bg-white p-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-none"
            />
          </FormField>
        </div>
        <div className="flex justify-end gap-3 border-t border-border px-6 py-4">
          <Button variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button onClick={save} disabled={loading}>
            <CheckCircle className="h-4 w-4" />
            {loading ? "Saving…" : "Save Status"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ───────────────────────────────────────────────────────────────
export default function AdminComplaints() {
  const [reports, setReports] = useState([]);
  const [phis, setPhis] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [assignTarget, setAssignTarget] = useState(null);
  const [statusTarget, setStatusTarget] = useState(null);

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      const [rData, phiData] = await Promise.all([
        adminService.complaints({ pageSize: 200 }),
        adminService.phis(),
      ]);
      setReports(rData.data ?? rData ?? []);
      setPhis(Array.isArray(phiData) ? phiData : []);
    } catch (err) {
      toast.error(err?.response?.data?.message ?? "Failed to load data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return reports.filter(
      (r) =>
        (statusFilter === "all" || r.status === statusFilter) &&
        (!q ||
          r.id?.toLowerCase().includes(q) ||
          r.location?.toLowerCase().includes(q) ||
          r.citizenName?.toLowerCase().includes(q))
    );
  }, [reports, query, statusFilter]);

  const pageCount = totalPages(filtered.length, PER_PAGE);
  const rows = paginate(filtered, Math.min(page, Math.max(1, pageCount)), PER_PAGE);

  /** Update a single report in local state after a save. */
  const patchReport = (updated) => {
    setReports((prev) =>
      prev.map((r) => (r.id === updated.id ? updated : r))
    );
  };

  const columns = [
    { key: "id", header: "ID", className: "font-semibold text-primary whitespace-nowrap" },
    {
      key: "citizenName",
      header: "Citizen",
      className: "whitespace-nowrap",
      render: (r) => r.citizenName || "—",
    },
    { key: "location", header: "Location", className: "max-w-[180px] truncate" },
    {
      key: "risk",
      header: "Risk",
      render: (r) => (
        <Badge className={RISK_TINT[r.risk] ?? "bg-muted text-muted-foreground"}>
          {r.risk}
        </Badge>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (r) => (
        <Badge className={STATUS_TINT[r.status] ?? "bg-muted text-muted-foreground"}>
          {r.status}
        </Badge>
      ),
    },
    {
      key: "phi",
      header: "Assigned PHI",
      className: "whitespace-nowrap",
      render: (r) => r.phi && r.phi !== "—" ? r.phi : <span className="text-muted-foreground">Unassigned</span>,
    },
    {
      key: "date",
      header: "Date",
      className: "whitespace-nowrap text-muted-foreground",
      render: (r) => fmt(r.date),
    },
    {
      key: "updated",
      header: "Updated",
      className: "whitespace-nowrap text-muted-foreground",
      render: (r) => timeAgo(r.updated),
    },
    {
      key: "action",
      header: "Actions",
      headerClassName: "text-right",
      className: "text-right",
      render: (r) => (
        <div className="flex items-center justify-end gap-1">
          <Button
            as={Link}
            to={`/admin/complaints/${r.id}`}
            size="sm"
            variant="ghost"
            title="View details"
          >
            <Eye className="h-3.5 w-3.5" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setStatusTarget(r)}
            title="Update status"
          >
            <CheckCircle className="h-3.5 w-3.5" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setAssignTarget(r)}
            title="Assign PHI"
          >
            <UserCheck className="h-3.5 w-3.5" /> Assign
          </Button>
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Manage Complaints"
        description="Review, assign PHI officers and track all citizen reports."
        action={
          <Button variant="ghost" size="sm" onClick={fetchAll} disabled={loading} title="Refresh">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        }
      />

      <div className="soft-shadow rounded-2xl border border-border bg-card">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-4">
          <SearchBar
            value={query}
            onChange={(v) => { setQuery(v); setPage(1); }}
            placeholder="Search by ID, citizen or location…"
            className="flex-1 sm:max-w-sm"
          />
          <div className="flex items-center gap-2">
            <Select
              className="h-10 w-52"
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              options={[
                { value: "all", label: "All statuses" },
                ...REPORT_STATUSES.map((s) => ({ value: s, label: s })),
              ]}
            />
          </div>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-border">
          {[
            { label: "Total", value: reports.length, color: "text-foreground" },
            { label: "Pending", value: reports.filter((r) => r.status === "Pending").length, color: "text-muted-foreground" },
            { label: "Unassigned", value: reports.filter((r) => !r.phiId).length, color: "text-warning" },
            { label: "Resolved", value: reports.filter((r) => r.status === "Resolved").length, color: "text-success" },
          ].map((stat) => (
            <div key={stat.label} className="bg-card px-4 py-3 text-center">
              <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{stat.label}</div>
            </div>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground">
            <RefreshCw className="mr-2 h-5 w-5 animate-spin" /> Loading complaints…
          </div>
        ) : (
          <Table
            columns={columns}
            rows={rows}
            empty={
              <EmptyState
                icon={reports.length === 0 ? ClipboardList : AlertCircle}
                title={reports.length === 0 ? "No complaints yet" : "No matches found"}
                description={
                  reports.length === 0
                    ? "Citizen complaints will appear here once submitted."
                    : "Try a different search term or status filter."
                }
                className="m-4"
              />
            }
          />
        )}

        {!loading && filtered.length > 0 && (
          <Pagination
            page={Math.min(page, Math.max(1, pageCount))}
            pageCount={pageCount}
            total={filtered.length}
            perPage={PER_PAGE}
            onChange={setPage}
          />
        )}
      </div>

      {/* Assign PHI Modal */}
      {assignTarget && (
        <AssignModal
          report={assignTarget}
          phis={phis}
          onClose={() => setAssignTarget(null)}
          onSaved={patchReport}
        />
      )}

      {/* Status Update Modal */}
      {statusTarget && (
        <StatusModal
          report={statusTarget}
          onClose={() => setStatusTarget(null)}
          onSaved={patchReport}
        />
      )}
    </>
  );
}
