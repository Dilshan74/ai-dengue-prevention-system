import { useState, useEffect, useMemo } from "react";
import {
  FileDown,
  FileSpreadsheet,
  Printer,
  FileText,
  Filter,
  Calendar,
  MapPin,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Loader2,
  RefreshCw,
  Layers,
  ArrowUpDown,
} from "lucide-react";
import { toast } from "sonner";
import Button from "../../../components/common/Button";
import PageHeader from "../../../components/common/PageHeader";
import Badge from "../../../components/common/Badge";
import { FormField, Input, Select } from "../../../components/common/Field";
import reportService from "../../../services/reportService";
import { STATUS_TINT, RISK_TINT } from "../../../utils/constants";

const AREA_OPTIONS = [
  "All areas",
  "Colombo",
  "Galle",
  "Borupana, Moratuwa",
  "Nugegoda",
  "Rajagiriya",
  "Maharagama",
  "Kotte",
  "Dehiwala",
];

const STATUS_OPTIONS = [
  "All statuses",
  "Pending",
  "Under Review",
  "Accepted",
  "Rejected",
  "Inspection Completed",
  "Resolved",
];

const RISK_OPTIONS = ["All levels", "High", "Medium", "Low"];

export default function GenerateReports() {
  // Default to 60 days back through today
  const today = new Date().toISOString().slice(0, 10);
  const sixtyDaysAgo = new Date(Date.now() - 60 * 86400000).toISOString().slice(0, 10);

  const [fromDate, setFromDate] = useState(sixtyDaysAgo);
  const [toDate, setToDate] = useState(today);
  const [area, setArea] = useState("All areas");
  const [status, setStatus] = useState("All statuses");
  const [risk, setRisk] = useState("All levels");

  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  // Export Loading States
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [downloadingExcel, setDownloadingExcel] = useState(false);
  const [downloadingCsv, setDownloadingCsv] = useState(false);

  // Load preview data from server
  const fetchPreviewReports = async () => {
    try {
      setLoading(true);
      const params = {
        pageSize: 100,
        startDate: fromDate || undefined,
        endDate: toDate || undefined,
        area: area !== "All areas" ? area : undefined,
        status: status !== "All statuses" ? status : undefined,
        risk: risk !== "All levels" ? risk : undefined,
      };

      const res = await reportService.list(params);
      const items = res?.data || res?.items || (Array.isArray(res) ? res : []);
      setReports(items);
    } catch (err) {
      console.error("Failed to load reports preview:", err);
      toast.error("Could not load inspection reports preview");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPreviewReports();
  }, [fromDate, toDate, area, status, risk]);

  // Query parameters payload for export
  const exportParams = useMemo(() => ({
    startDate: fromDate || undefined,
    endDate: toDate || undefined,
    area: area !== "All areas" ? area : undefined,
    status: status !== "All statuses" ? status : undefined,
    risk: risk !== "All levels" ? risk : undefined,
  }), [fromDate, toDate, area, status, risk]);

  // Export File Downloader Helper
  const handleDownload = async (format, setLoadingState) => {
    if (reports.length === 0) {
      toast.warning("No records match your selected filters to export");
      return;
    }

    try {
      setLoadingState(true);
      toast.info(`Preparing ${format.toUpperCase()} export...`);

      const blobData = await reportService.export(format, exportParams);
      const mimeTypes = {
        pdf: "application/pdf",
        excel: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        csv: "text/csv;charset=utf-8;",
      };
      const extension = format === "excel" ? "xlsx" : format;

      const blob = new Blob([blobData], { type: mimeTypes[format] || "application/octet-stream" });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = `dengue_inspection_reports_${new Date().toISOString().slice(0, 10)}.${extension}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);

      toast.success(`${format.toUpperCase()} report successfully downloaded!`);
    } catch (err) {
      console.error(`Export ${format} failed:`, err);
      toast.error(`Failed to export ${format.toUpperCase()} report`);
    } finally {
      setLoadingState(false);
    }
  };

  // Metrics summary
  const stats = useMemo(() => {
    return {
      total: reports.length,
      highRisk: reports.filter((r) => r.risk === "High").length,
      accepted: reports.filter((r) => r.status === "Accepted").length,
      resolved: reports.filter((r) => r.status === "Resolved" || r.status === "Inspection Completed").length,
    };
  }, [reports]);

  const handleResetFilters = () => {
    setFromDate(sixtyDaysAgo);
    setToDate(today);
    setArea("All areas");
    setStatus("All statuses");
    setRisk("All levels");
    toast.info("Filters reset to default");
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <PageHeader
        title="Generate Reports"
        description="Filter, preview, and export verified public health inspection data and dengue surveillance records."
        action={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetFilters}
              className="text-xs rounded-xl"
            >
              Reset Filters
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={fetchPreviewReports}
              disabled={loading}
              className="text-xs rounded-xl"
            >
              <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
            </Button>
          </div>
        }
      />

      {/* Top Grid: Filters & Export Actions */}
      <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr] items-start">
        {/* Left Card: Filter Panel */}
        <div className="soft-shadow rounded-3xl border border-border bg-card p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-primary" />
              <h3 className="font-bold text-sm text-foreground">Inspection Data Filters</h3>
            </div>
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              {reports.length} Records Found
            </span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="From Date" htmlFor="from-date">
              <Input
                id="from-date"
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
              />
            </FormField>

            <FormField label="To Date" htmlFor="to-date">
              <Input
                id="to-date"
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
              />
            </FormField>

            <FormField label="Jurisdiction / Area" htmlFor="filter-area">
              <Select
                id="filter-area"
                value={area}
                onChange={(e) => setArea(e.target.value)}
                options={AREA_OPTIONS}
              />
            </FormField>

            <FormField label="Report Status" htmlFor="filter-status">
              <Select
                id="filter-status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                options={STATUS_OPTIONS}
              />
            </FormField>

            <div className="sm:col-span-2">
              <FormField label="Risk Classification" htmlFor="filter-risk">
                <Select
                  id="filter-risk"
                  value={risk}
                  onChange={(e) => setRisk(e.target.value)}
                  options={RISK_OPTIONS}
                />
              </FormField>
            </div>
          </div>
        </div>

        {/* Right Card: Export Actions */}
        <div className="soft-shadow rounded-3xl border border-border bg-gradient-to-br from-card via-card to-primary/5 p-6 space-y-4">
          <div className="border-b border-border pb-3">
            <h3 className="font-bold text-sm text-foreground">Export Documents</h3>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Generate official formatted documents for MOH health bulletins, field teams, or local councils.
            </p>
          </div>

          <div className="space-y-3 pt-1">
            {/* Download PDF Button */}
            <Button
              className="w-full justify-between rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold py-2.5 shadow-sm"
              onClick={() => handleDownload("pdf", setDownloadingPdf)}
              disabled={downloadingPdf || loading || reports.length === 0}
            >
              <div className="flex items-center gap-2">
                {downloadingPdf ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <FileDown className="h-4 w-4" />
                )}
                <span>Download Official PDF Report</span>
              </div>
              <span className="text-[10px] bg-teal-700 px-2 py-0.5 rounded font-mono">.pdf</span>
            </Button>

            {/* Download Excel Button */}
            <Button
              variant="outline"
              className="w-full justify-between rounded-xl font-semibold py-2.5 border-border hover:bg-muted/50"
              onClick={() => handleDownload("excel", setDownloadingExcel)}
              disabled={downloadingExcel || loading || reports.length === 0}
            >
              <div className="flex items-center gap-2">
                {downloadingExcel ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
                )}
                <span>Download Spreadsheet (Excel)</span>
              </div>
              <span className="text-[10px] bg-muted px-2 py-0.5 rounded font-mono text-muted-foreground">.xlsx</span>
            </Button>

            {/* Download CSV Button */}
            <Button
              variant="outline"
              className="w-full justify-between rounded-xl font-semibold py-2.5 border-border hover:bg-muted/50"
              onClick={() => handleDownload("csv", setDownloadingCsv)}
              disabled={downloadingCsv || loading || reports.length === 0}
            >
              <div className="flex items-center gap-2">
                {downloadingCsv ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <FileText className="h-4 w-4 text-sky-600" />
                )}
                <span>Download Raw Data (CSV)</span>
              </div>
              <span className="text-[10px] bg-muted px-2 py-0.5 rounded font-mono text-muted-foreground">.csv</span>
            </Button>

            {/* Print Button */}
            <Button
              variant="outline"
              className="w-full justify-between rounded-xl font-semibold py-2.5 border-border hover:bg-muted/50"
              onClick={() => window.print()}
              disabled={reports.length === 0}
            >
              <div className="flex items-center gap-2">
                <Printer className="h-4 w-4 text-purple-600" />
                <span>Print Formal Summary</span>
              </div>
              <span className="text-[10px] bg-muted px-2 py-0.5 rounded text-muted-foreground">Print</span>
            </Button>
          </div>

          <div className="rounded-2xl border border-border/70 bg-muted/20 p-3 text-[11px] text-muted-foreground">
            Includes inspector timestamp, verified GIS coordinates, hazard severity score, and citizen feedback history.
          </div>
        </div>
      </div>

      {/* KPI Tiles Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="rounded-2xl border border-border bg-card p-3.5 soft-shadow text-center">
          <div className="text-2xl font-black text-foreground">{stats.total}</div>
          <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mt-0.5">
            Matching Reports
          </div>
        </div>

        <div className="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-3.5 soft-shadow text-center">
          <div className="text-2xl font-black text-rose-600 dark:text-rose-400">{stats.highRisk}</div>
          <div className="text-[11px] font-semibold uppercase tracking-wider text-rose-700 dark:text-rose-300 mt-0.5">
            High Risk Sites
          </div>
        </div>

        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-3.5 soft-shadow text-center">
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{stats.accepted}</div>
          <div className="text-[11px] font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-300 mt-0.5">
            Accepted / Visits
          </div>
        </div>

        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-3.5 soft-shadow text-center">
          <div className="text-2xl font-black text-primary">{stats.resolved}</div>
          <div className="text-[11px] font-semibold uppercase tracking-wider text-primary mt-0.5">
            Resolved / Cleaned
          </div>
        </div>
      </div>

      {/* Live Data Preview Table */}
      <div className="soft-shadow rounded-3xl border border-border bg-card overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-border bg-muted/20">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-primary" />
            <h3 className="font-bold text-sm text-foreground">Export Data Preview</h3>
          </div>
          <span className="text-xs text-muted-foreground">
            Showing {reports.length} items to be included in export
          </span>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center p-12 gap-3 text-muted-foreground">
            <Loader2 className="h-7 w-7 animate-spin text-primary" />
            <span className="text-xs font-semibold">Filtering inspection database...</span>
          </div>
        ) : reports.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">
            <AlertTriangle className="h-8 w-8 mx-auto text-amber-500/80 mb-2" />
            <p className="text-sm font-semibold text-foreground">No reports found for selected filter criteria</p>
            <p className="text-xs text-muted-foreground mt-1">
              Try broadening your date range or clearing the Area and Status filters.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/40 border-b border-border text-[11px] uppercase font-bold text-muted-foreground tracking-wider">
                <tr>
                  <th className="py-3 px-4">Report ID</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Citizen</th>
                  <th className="py-3 px-4">Location</th>
                  <th className="py-3 px-4">Risk Level</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Assigned PHI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {reports.map((r) => (
                  <tr key={r.id} className="hover:bg-muted/30 transition-colors">
                    <td className="py-3 px-4 font-bold text-primary font-mono">{r.id}</td>
                    <td className="py-3 px-4 text-muted-foreground whitespace-nowrap">
                      {r.date ? new Date(r.date).toISOString().slice(0, 10) : "—"}
                    </td>
                    <td className="py-3 px-4 font-semibold text-foreground">
                      {r.citizenName || r.name || "Citizen"}
                    </td>
                    <td className="py-3 px-4 text-foreground/90 max-w-[200px] truncate">
                      {r.location || r.address || "—"}
                    </td>
                    <td className="py-3 px-4">
                      <Badge className={RISK_TINT[r.risk] || RISK_TINT.Medium}>
                        {r.risk || "Medium"}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <Badge className={STATUS_TINT[r.status] || STATUS_TINT.Pending}>
                        {r.status || "Pending"}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-muted-foreground">
                      {r.phi && r.phi !== "—" ? r.phi : "Unassigned"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
