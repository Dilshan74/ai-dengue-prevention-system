import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Check, Eye, FileSearch, MapPin, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import Badge from "../../../components/common/Badge";
import Button from "../../../components/common/Button";
import EmptyState from "../../../components/common/EmptyState";
import PageHeader from "../../../components/common/PageHeader";
import Pagination from "../../../components/common/Pagination";
import SearchBar from "../../../components/common/SearchBar";
import Table from "../../../components/common/Table";
import { Select } from "../../../components/common/Field";
import { PHI_REPORTS, RISK_TINT, STATUS_TINT } from "../../../utils/constants";
import { matchesQuery, paginate, totalPages } from "../../../utils/helpers";
import phiService from "../../../services/phiService";

const PER_PAGE = 5;

const STATUS_OPTIONS = [
  { value: "all", label: "All statuses" },
  { value: "Pending", label: "Pending" },
  { value: "Reviewed", label: "Reviewed" },
  { value: "Accepted", label: "Accepted" },
  { value: "Rejected", label: "Rejected" },
];

const RISK_OPTIONS = [
  { value: "all", label: "All risks" },
  { value: "High", label: "High" },
  { value: "Medium", label: "Medium" },
  { value: "Low", label: "Low" },
];

export default function ViewReports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [risk, setRisk] = useState("all");
  const [page, setPage] = useState(1);

  const fetchReports = () => {
    setLoading(true);
    phiService
      .reports({ pageSize: 50 })
      .then((res) => {
        const items = res?.data || res?.items || (Array.isArray(res) ? res : []);
        setReports(items.length > 0 ? items : PHI_REPORTS);
      })
      .catch((err) => {
        console.warn("Could not load reports from server, falling back to cached:", err);
        setReports(PHI_REPORTS);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const filtered = useMemo(
    () =>
      reports.filter(
        (report) =>
          matchesQuery(report, query, ["id", "name", "citizenName", "location", "description"]) &&
          (status === "all" || report.status === status) &&
          (risk === "all" || report.risk === risk),
      ),
    [reports, query, status, risk],
  );

  const setStatusFor = async (id, nextStatus) => {
    try {
      if (nextStatus === "Accepted") {
        await phiService.acceptReport(id);
        toast.success(`Report ${id} accepted`);
      } else if (nextStatus === "Rejected") {
        await phiService.rejectReport(id);
        toast.error(`Report ${id} rejected`);
      }
      setReports((current) =>
        current.map((report) =>
          report.id === id ? { ...report, status: nextStatus } : report,
        ),
      );
    } catch (err) {
      toast.error(err.response?.data?.message || `Failed to update status for ${id}`);
    }
  };

  const pageCount = totalPages(filtered.length, PER_PAGE);
  const currentPage = Math.min(page, pageCount);
  const rows = paginate(filtered, currentPage, PER_PAGE);

  const columns = [
    {
      key: "id",
      header: "Report",
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-lg bg-muted text-lg overflow-hidden border border-border shrink-0">
            {row.image && (row.image.startsWith("/") || row.image.startsWith("http")) ? (
              <img src={row.image} alt={row.id} className="h-full w-full object-cover" />
            ) : (
              <span>{row.image || "🪣"}</span>
            )}
          </div>
          <div>
            <span className="font-semibold block">{row.id}</span>
            {row.phi && row.phi !== "—" && (
              <span className="text-[10px] text-muted-foreground">PHI: {row.phi}</span>
            )}
          </div>
        </div>
      ),
    },
    {
      key: "name",
      header: "Citizen",
      className: "whitespace-nowrap",
      render: (row) => row.citizenName || row.name || "Citizen",
    },
    { key: "location", header: "Location", className: "whitespace-nowrap" },
    {
      key: "risk",
      header: "Risk",
      render: (row) => (
        <Badge className={RISK_TINT[row.risk] || RISK_TINT.Medium}>{row.risk}</Badge>
      ),
    },
    {
      key: "date",
      header: "Date",
      className: "whitespace-nowrap text-muted-foreground",
      render: (row) => {
        if (!row.date) return "—";
        try {
          return new Date(row.date).toLocaleDateString();
        } catch {
          return String(row.date);
        }
      },
    },
    {
      key: "status",
      header: "Status",
      render: (row) => (
        <Badge className={STATUS_TINT[row.status] || STATUS_TINT.Pending}>{row.status}</Badge>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      headerClassName: "text-right",
      render: (row) => (
        <div className="flex justify-end gap-1">
          <Button as={Link} to={`/phi/reports/${row.id}`} size="sm" variant="ghost" aria-label={`View ${row.id}`}>
            <Eye className="h-3.5 w-3.5" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="text-success hover:bg-success/10"
            aria-label={`Accept ${row.id}`}
            onClick={() => setStatusFor(row.id, "Accepted")}
          >
            <Check className="h-3.5 w-3.5" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="text-destructive hover:bg-destructive/10"
            aria-label={`Reject ${row.id}`}
            onClick={() => setStatusFor(row.id, "Rejected")}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
          <Button
            as={Link}
            to={`/phi/visits?reportId=${row.id}`}
            state={{ report: row }}
            size="sm"
            variant="ghost"
            aria-label={`Visit ${row.id}`}
          >
            <MapPin className="h-3.5 w-3.5" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Incoming Reports"
        description="Review AI-classified citizen submissions and take action"
      />
      <div className="soft-shadow rounded-2xl border border-border bg-card">
        <div className="flex flex-wrap items-center gap-3 border-b border-border p-4">
          <SearchBar
            value={query}
            onChange={(value) => {
              setQuery(value);
              setPage(1);
            }}
            placeholder="Search reports…"
            className="flex-1 sm:max-w-sm"
          />
          <Select
            className="h-10 w-44"
            value={status}
            onChange={(event) => {
              setStatus(event.target.value);
              setPage(1);
            }}
            options={STATUS_OPTIONS}
          />
          <Select
            className="h-10 w-40"
            value={risk}
            onChange={(event) => {
              setRisk(event.target.value);
              setPage(1);
            }}
            options={RISK_OPTIONS}
          />
        </div>

        <Table
          columns={columns}
          rows={rows}
          empty={
            <EmptyState
              icon={FileSearch}
              title="No reports match your filters"
              className="m-4"
            />
          }
        />

        {filtered.length > 0 && (
          <Pagination
            page={currentPage}
            pageCount={pageCount}
            total={filtered.length}
            perPage={PER_PAGE}
            onChange={setPage}
          />
        )}
      </div>
    </>
  );
}
