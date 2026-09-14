import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Eye, FileSearch, Plus, RefreshCw, ShieldAlert, Clock, CheckCircle2, AlertTriangle, Layers } from "lucide-react";
import { toast } from "sonner";
import Badge from "../../../components/common/Badge";
import Button from "../../../components/common/Button";
import EmptyState from "../../../components/common/EmptyState";
import PageHeader from "../../../components/common/PageHeader";
import Pagination from "../../../components/common/Pagination";
import SearchBar from "../../../components/common/SearchBar";
import Table from "../../../components/common/Table";
import { Select } from "../../../components/common/Field";
import { STATUS_TINT, RISK_TINT, REPORT_STATUSES } from "../../../utils/constants";
import { paginate, totalPages } from "../../../utils/helpers";
import citizenService from "../../../services/citizenService";
import CreateComplaint from "./CreateComplaint";

const PER_PAGE = 8;

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

export default function TrackComplaint() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [showCreate, setShowCreate] = useState(false);

  const fetchReports = useCallback(async () => {
    try {
      setLoading(true);
      const data = await citizenService.complaints({ pageSize: 100 });
      setReports(data.data ?? data ?? []);
    } catch (err) {
      console.error("Failed to load complaints:", err);
      toast.error(err?.response?.data?.message ?? "Failed to load complaints", {
        id: "track-complaints-error",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return reports.filter(
      (r) =>
        (status === "all" || r.status === status) &&
        (!q ||
          r.id?.toLowerCase().includes(q) ||
          r.location?.toLowerCase().includes(q) ||
          r.phi?.toLowerCase().includes(q) ||
          r.risk?.toLowerCase().includes(q))
    );
  }, [reports, query, status]);

  const pageCount = totalPages(filtered.length, PER_PAGE);
  const currentPage = Math.min(page, Math.max(1, pageCount));
  const rows = paginate(filtered, currentPage, PER_PAGE);

  // Telemetry counters
  const totalCount = reports.length;
  const highRiskCount = reports.filter(r => r.risk === "High").length;
  const pendingCount = reports.filter(r => r.status === "Pending" || r.status === "Under Review").length;
  const resolvedCount = reports.filter(r => r.status === "Resolved" || r.status === "Inspection Completed").length;

  const columns = [
    { 
      key: "id", 
      header: "REPORT ID", 
      className: "font-mono text-xs font-semibold text-teal-600 dark:text-teal-400" 
    },
    {
      key: "image",
      header: "EVIDENCE",
      render: (row) => (
        <div className="h-8 w-8 rounded border border-border bg-slate-900 flex items-center justify-center overflow-hidden">
          {row.images?.[0] ? (
            <img src={row.images[0]} alt="evidence" className="h-full w-full object-cover" />
          ) : (
            <span className="text-xs">{row.image || "🪣"}</span>
          )}
        </div>
      ),
    },
    { 
      key: "risk", 
      header: "RISK LEVEL",
      render: (row) => (
        <Badge className={`font-mono text-[11px] uppercase ${RISK_TINT[row.risk] || "bg-muted text-muted-foreground"}`}>
          {row.risk || "Medium"}
        </Badge>
      )
    },
    {
      key: "date",
      header: "LOGGED DATE",
      className: "whitespace-nowrap font-mono text-xs text-muted-foreground",
      render: (row) => row.date ? new Date(row.date).toISOString().slice(0, 10) : "—",
    },
    { key: "location", header: "INCIDENT LOCATION", className: "whitespace-nowrap text-xs font-medium" },
    {
      key: "status",
      header: "INSPECTION STATUS",
      render: (row) => (
        <Badge className={`font-mono text-[11px] uppercase ${STATUS_TINT[row.status] ?? "bg-muted text-muted-foreground"}`}>
          {row.status}
        </Badge>
      ),
    },
    {
      key: "phi",
      header: "ASSIGNED PHI",
      className: "whitespace-nowrap text-xs text-muted-foreground font-mono",
      render: (row) => row.phi || "—",
    },
    {
      key: "action",
      header: "AUDIT",
      headerClassName: "text-right",
      className: "text-right",
      render: (row) => (
        <Button as={Link} to={`/citizen/track/${row.id}`} size="sm" variant="outline" className="font-mono text-xs h-7 px-2">
          <Eye className="h-3 w-3 mr-1" /> AUDIT
        </Button>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Surveillance Incidents &amp; Complaint Registry"
        description="Official audit registry of citizen-reported mosquito breeding sites and PHI inspection queue status."
        action={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchReports}
              disabled={loading}
              title="Refresh Registry"
              className="font-mono text-xs"
            >
              <RefreshCw className={`h-3.5 w-3.5 mr-1 ${loading ? "animate-spin" : ""}`} /> REFRESH
            </Button>
            <Button 
              size="sm" 
              onClick={() => setShowCreate(true)}
              className="font-mono text-xs"
            >
              <Plus className="h-3.5 w-3.5 mr-1" /> NEW REPORT
            </Button>
          </div>
        }
      />

      {/* Utilitarian Telemetry Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5 font-mono">
        <div className="p-3 rounded-lg border border-border bg-card">
          <div className="flex items-center justify-between text-muted-foreground text-xs">
            <span>TOTAL REPORTS</span>
            <Layers className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />
          </div>
          <div className="text-xl font-bold text-foreground mt-1">{totalCount}</div>
        </div>

        <div className="p-3 rounded-lg border border-rose-500/20 bg-rose-500/5">
          <div className="flex items-center justify-between text-rose-700 dark:text-rose-400 text-xs">
            <span>HIGH RISK SITES</span>
            <AlertTriangle className="h-3.5 w-3.5 text-rose-600 dark:text-rose-400" />
          </div>
          <div className="text-xl font-bold text-rose-700 dark:text-rose-400 mt-1">{highRiskCount}</div>
        </div>

        <div className="p-3 rounded-lg border border-amber-500/20 bg-amber-500/5">
          <div className="flex items-center justify-between text-amber-700 dark:text-amber-400 text-xs">
            <span>ACTIVE QUEUE</span>
            <Clock className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="text-xl font-bold text-amber-700 dark:text-amber-400 mt-1">{pendingCount}</div>
        </div>

        <div className="p-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5">
          <div className="flex items-center justify-between text-emerald-700 dark:text-emerald-400 text-xs">
            <span>VERIFIED / RESOLVED</span>
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="text-xl font-bold text-emerald-700 dark:text-emerald-400 mt-1">{resolvedCount}</div>
        </div>
      </div>

      {/* Complaints Table Container */}
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-3.5 bg-muted/20">
          <SearchBar
            value={query}
            onChange={(value) => { setQuery(value); setPage(1); }}
            placeholder="Search report ID, location, or PHI officer…"
            className="w-full sm:w-72 font-mono text-xs"
          />
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-muted-foreground uppercase">FILTER:</span>
            <Select
              value={status}
              onChange={(e) => { setStatus(e.target.value); setPage(1); }}
              options={[
                { value: "all", label: "All Statuses" },
                ...REPORT_STATUSES.map((s) => ({ value: s, label: s })),
              ]}
              className="w-44 font-mono text-xs"
            />
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs font-mono text-muted-foreground">
            <RefreshCw className="h-5 w-5 animate-spin mx-auto text-teal-600 dark:text-teal-400 mb-2" />
            SYNCHRONIZING AUDIT REGISTRY...
          </div>
        ) : rows.length === 0 ? (
          <EmptyState
            icon={FileSearch}
            title="No matching surveillance records"
            description={
              query || status !== "all"
                ? "Try clearing query parameters to view all active reports."
                : "No incident reports logged yet in your GN surveillance sector."
            }
            action={
              (query || status !== "all") && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => { setQuery(""); setStatus("all"); }}
                  className="font-mono text-xs"
                >
                  RESET FILTERS
                </Button>
              )
            }
          />
        ) : (
          <>
            <Table columns={columns} data={rows} className="font-sans" />
            <div className="border-t border-border p-3 flex justify-between items-center bg-muted/10 font-mono text-xs text-muted-foreground">
              <span>SHOWING {rows.length} OF {filtered.length} RECORDS</span>
              {pageCount > 1 && (
                <Pagination page={currentPage} totalPages={pageCount} onChange={setPage} />
              )}
            </div>
          </>
        )}
      </div>

      {showCreate && (
        <CreateComplaint
          open={showCreate}
          onClose={() => setShowCreate(false)}
          onCreated={() => {
            setShowCreate(false);
            fetchReports();
          }}
        />
      )}
    </>
  );
}
