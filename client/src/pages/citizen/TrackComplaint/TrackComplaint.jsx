import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Eye, FileSearch, Plus, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import Badge from "../../../components/common/Badge";
import Button from "../../../components/common/Button";
import EmptyState from "../../../components/common/EmptyState";
import PageHeader from "../../../components/common/PageHeader";
import Pagination from "../../../components/common/Pagination";
import SearchBar from "../../../components/common/SearchBar";
import Table from "../../../components/common/Table";
import { Select } from "../../../components/common/Field";
import { STATUS_TINT, REPORT_STATUSES } from "../../../utils/constants";
import { paginate, totalPages } from "../../../utils/helpers";
import citizenService from "../../../services/citizenService";
import CreateComplaint from "./CreateComplaint";

const PER_PAGE = 5;

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
          r.phi?.toLowerCase().includes(q))
    );
  }, [reports, query, status]);

  const pageCount = totalPages(filtered.length, PER_PAGE);
  const currentPage = Math.min(page, Math.max(1, pageCount));
  const rows = paginate(filtered, currentPage, PER_PAGE);

  const columns = [
    { key: "id", header: "ID", className: "font-semibold text-primary" },
    {
      key: "image",
      header: "Image",
      render: (row) => (
        <div className="grid h-9 w-9 place-items-center rounded-lg bg-muted text-lg overflow-hidden">
          {row.images?.[0] ? (
            <img src={row.images[0]} alt="report" className="h-full w-full object-cover" />
          ) : (
            <span>{row.image || "🪣"}</span>
          )}
        </div>
      ),
    },
    {
      key: "date",
      header: "Date",
      className: "whitespace-nowrap text-muted-foreground",
      render: (row) => row.date ? new Date(row.date).toISOString().slice(0, 10) : "—",
    },
    { key: "location", header: "Location", className: "whitespace-nowrap" },
    {
      key: "status",
      header: "Status",
      render: (row) => (
        <Badge className={STATUS_TINT[row.status] ?? "bg-muted text-muted-foreground"}>
          {row.status}
        </Badge>
      ),
    },
    {
      key: "phi",
      header: "Assigned PHI",
      className: "whitespace-nowrap",
      render: (row) => row.phi || "—",
    },
    {
      key: "updated",
      header: "Last Updated",
      className: "whitespace-nowrap text-muted-foreground",
      render: (row) => timeAgo(row.updated),
    },
    {
      key: "action",
      header: "Action",
      headerClassName: "text-right",
      className: "text-right",
      render: (row) => (
        <Button as={Link} to={`/citizen/track/${row.id}`} size="sm" variant="ghost">
          <Eye className="h-3.5 w-3.5" /> View
        </Button>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Track your complaints"
        description="Every report you've submitted, in one place."
        action={
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={fetchReports}
              disabled={loading}
              title="Refresh"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </Button>
            <Button size="sm" onClick={() => setShowCreate(true)}>
              <Plus className="h-4 w-4" /> New Complaint
            </Button>
          </div>
        }
      />

      <div className="soft-shadow rounded-2xl border border-border bg-card">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-4">
          <SearchBar
            value={query}
            onChange={(value) => { setQuery(value); setPage(1); }}
            placeholder="Search by ID or location…"
            className="flex-1 sm:max-w-sm"
          />
          <Select
            className="h-10 w-48"
            value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(1); }}
            options={[
              { value: "all", label: "All statuses" },
              ...REPORT_STATUSES.map((s) => ({ value: s, label: s })),
            ]}
          />
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
                icon={FileSearch}
                title="No complaints found"
                description={
                  reports.length === 0
                    ? "You haven't submitted any complaints yet. Click \"New Complaint\" to get started."
                    : "Try a different search term or status filter."
                }
                action={
                  reports.length === 0 && (
                    <Button size="sm" onClick={() => setShowCreate(true)}>
                      <Plus className="h-4 w-4" /> New Complaint
                    </Button>
                  )
                }
                className="m-4"
              />
            }
          />
        )}

        {!loading && filtered.length > 0 && (
          <Pagination
            page={currentPage}
            pageCount={pageCount}
            total={filtered.length}
            perPage={PER_PAGE}
            onChange={setPage}
          />
        )}
      </div>

      {/* New Complaint Modal */}
      {showCreate && (
        <CreateComplaint
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
