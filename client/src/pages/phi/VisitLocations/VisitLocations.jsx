import { useState, useEffect, useMemo, useCallback } from "react";
import { useParams, useSearchParams, useLocation, Link, useNavigate } from "react-router-dom";
import {
  ClipboardCheck,
  MapPin,
  Navigation,
  Phone,
  User,
  ArrowLeft,
  ExternalLink,
  Layers,
  Crosshair,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Eye,
} from "lucide-react";
import { toast } from "sonner";
import Button from "../../../components/common/Button";
import PageHeader from "../../../components/common/PageHeader";
import Badge from "../../../components/common/Badge";
import { Checkbox, Label, Select, Textarea } from "../../../components/common/Field";
import { REPORT_STATUSES, VISIT_CHECKLIST, STATUS_TINT, RISK_TINT } from "../../../utils/constants";
import phiService from "../../../services/phiService";
import reportService from "../../../services/reportService";

export default function VisitLocations() {
  const { id: paramId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();

  const queryReportId = paramId || searchParams.get("reportId");

  const [report, setReport] = useState(() => location.state?.report || null);
  const [allReports, setAllReports] = useState([]);
  const [loading, setLoading] = useState(!location.state?.report);
  const [mapType, setMapType] = useState("google"); // "google" | "satellite" | "osm"
  const [statusVal, setStatusVal] = useState("Inspection Completed");
  const [comments, setComments] = useState("");
  const [saving, setSaving] = useState(false);

  const [checked, setChecked] = useState(() =>
    Object.fromEntries(VISIT_CHECKLIST.map((item, index) => [item, index < 2]))
  );

  // Fetch all reports to populate switcher and fallback
  useEffect(() => {
    let isMounted = true;
    phiService
      .reports({ pageSize: 50 })
      .then((res) => {
        if (!isMounted) return;
        const list = res?.items || res?.data || (Array.isArray(res) ? res : []);
        setAllReports(list);

        // If no report selected yet and no URL param, default to the first report
        if (!queryReportId && !report && list.length > 0) {
          const first = list[0];
          setReport(first);
          setStatusVal(first.status === "Pending" ? "Inspection Scheduled" : first.status || "Inspection Completed");
          setSearchParams({ reportId: first.id }, { replace: true });
        }
      })
      .catch((err) => {
        console.error("Failed to load reports list for visit:", err);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Fetch specific report details when queryReportId changes
  useEffect(() => {
    if (!queryReportId) return;

    let isMounted = true;
    setLoading(true);

    phiService
      .report(queryReportId)
      .then((data) => {
        if (!isMounted) return;
        setReport(data);
        setStatusVal(data.status === "Pending" ? "Inspection Scheduled" : data.status || "Inspection Completed");
        setLoading(false);
      })
      .catch(async (err) => {
        console.warn("phiService.report failed, falling back to reportService:", err);
        try {
          const fallback = await reportService.byId(queryReportId);
          if (isMounted) {
            setReport(fallback);
            setStatusVal(fallback.status === "Pending" ? "Inspection Scheduled" : fallback.status || "Inspection Completed");
            setLoading(false);
          }
        } catch (e) {
          console.error("Failed to load report for visit:", e);
          if (isMounted) setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [queryReportId]);

  // Handle switching report from the selector dropdown
  const handleReportChange = useCallback(
    (newId) => {
      if (!newId || newId === report?.id) return;
      setSearchParams({ reportId: newId });
      const found = allReports.find((r) => r.id === newId);
      if (found) {
        setReport(found);
        setStatusVal(found.status === "Pending" ? "Inspection Scheduled" : found.status || "Inspection Completed");
      }
    },
    [allReports, report?.id, setSearchParams]
  );

  // Fallback coordinates (default Sri Lanka / Colombo)
  const lat = useMemo(() => {
    const parsed = Number(report?.lat);
    return !isNaN(parsed) && parsed !== 0 ? parsed : 6.8712;
  }, [report?.lat]);

  const lng = useMemo(() => {
    const parsed = Number(report?.lng);
    return !isNaN(parsed) && parsed !== 0 ? parsed : 79.889;
  }, [report?.lng]);

  // Construct real map embed URLs
  const mapUrl = useMemo(() => {
    if (mapType === "osm") {
      const delta = 0.008;
      return `https://www.openstreetmap.org/export/embed.html?bbox=${(lng - delta).toFixed(6)}%2C${(lat - delta).toFixed(6)}%2C${(lng + delta).toFixed(6)}%2C${(lat + delta).toFixed(6)}&layer=mapnik&marker=${lat.toFixed(6)}%2C${lng.toFixed(6)}`;
    }
    if (mapType === "satellite") {
      return `https://maps.google.com/maps?q=${lat.toFixed(6)},${lng.toFixed(6)}&t=k&z=17&output=embed`;
    }
    // Default interactive Google Map
    return `https://maps.google.com/maps?q=${lat.toFixed(6)},${lng.toFixed(6)}&z=16&output=embed`;
  }, [mapType, lat, lng]);

  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;

  // Handle status update save
  const handleSaveUpdate = async () => {
    if (!report?.id) return;
    setSaving(true);
    try {
      const activeChecklistItems = Object.entries(checked)
        .filter(([, isChecked]) => isChecked)
        .map(([key]) => key)
        .join(", ");

      const updateNote = comments
        ? `${comments} (Checklist: ${activeChecklistItems || "None"})`
        : `Checklist marked: ${activeChecklistItems || "Routine inspection"}`;

      const res = await reportService.updateStatus(report.id, statusVal, updateNote);
      toast.success(`Report ${report.id} updated to "${statusVal}"`);
      if (res) {
        setReport((prev) => ({ ...prev, ...res, status: statusVal }));
      }
    } catch (err) {
      console.error("Failed to update status:", err);
      toast.error(err?.response?.data?.message || "Failed to update visit status.");
    } finally {
      setSaving(false);
    }
  };

  const citizenName = report?.citizenName || report?.name || "Citizen Reporter";
  const citizenMobile = report?.citizenMobile || report?.phone || report?.mobile || "+94 77 123 4567";
  const siteAddress = report?.address || report?.location || "No 12, Temple Rd, Nugegoda";
  const displayLocation = report?.location || "Nugegoda, Ward 12";
  const reportRisk = report?.risk || "High";
  const reportStatus = report?.status || "Pending";

  const photoUrl = useMemo(() => {
    const img = report?.image || (report?.images && report?.images[0]);
    if (!img) return null;
    if (img.startsWith("http") || img.startsWith("/")) return img;
    return `/uploads/${img}`;
  }, [report?.image, report?.images]);

  return (
    <>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Visit Location — {report?.id || "DG-1049"}
            </h1>
            <Badge className={RISK_TINT[reportRisk] || RISK_TINT.High}>
              {reportRisk} Risk
            </Badge>
            <Badge className={STATUS_TINT[reportStatus] || STATUS_TINT.Pending}>
              {reportStatus}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {displayLocation} · Citizen: {citizenName}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Quick Report Switcher */}
          {allReports.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground whitespace-nowrap">Switch Target:</span>
              <select
                value={report?.id || ""}
                onChange={(e) => handleReportChange(e.target.value)}
                className="h-9 rounded-lg border border-border bg-card px-2.5 text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-primary shadow-xs"
              >
                {allReports.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.id} ({r.location?.split(",")[0] || "Report"})
                  </option>
                ))}
              </select>
            </div>
          )}

          {report?.id && (
            <Button
              as={Link}
              to={`/phi/reports/${report.id}`}
              variant="outline"
              size="sm"
              className="text-xs"
            >
              <Eye className="h-3.5 w-3.5 mr-1" /> View Report
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        {/* Left Column: Interactive Real Map & Citizen Details */}
        <div className="space-y-6">
          {/* Real Interactive Map Card */}
          <div className="soft-shadow rounded-2xl border border-border bg-card overflow-hidden">
            {/* Map Header Controls */}
            <div className="flex flex-wrap items-center justify-between border-b border-border bg-muted/40 px-4 py-2.5 text-xs">
              <div className="flex items-center gap-2 font-medium text-foreground">
                <MapPin className="h-4 w-4 text-primary" />
                <span>Hazard Coordinates:</span>
                <code className="bg-background/80 px-2 py-0.5 rounded border border-border text-[11px] font-mono text-primary font-semibold">
                  {lat.toFixed(4)}° N, {lng.toFixed(4)}° E
                </code>
              </div>

              {/* Map Layer Switcher */}
              <div className="flex items-center gap-1 bg-background/80 rounded-lg p-0.5 border border-border">
                <button
                  type="button"
                  onClick={() => setMapType("google")}
                  className={`px-2 py-1 rounded text-[11px] font-medium transition-colors ${
                    mapType === "google"
                      ? "bg-primary text-white shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Map
                </button>
                <button
                  type="button"
                  onClick={() => setMapType("satellite")}
                  className={`px-2 py-1 rounded text-[11px] font-medium transition-colors ${
                    mapType === "satellite"
                      ? "bg-primary text-white shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Satellite
                </button>
                <button
                  type="button"
                  onClick={() => setMapType("osm")}
                  className={`px-2 py-1 rounded text-[11px] font-medium transition-colors ${
                    mapType === "osm"
                      ? "bg-primary text-white shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  OSM
                </button>
              </div>
            </div>

            {/* Map Frame */}
            <div className="relative h-[340px] w-full bg-slate-100">
              {loading ? (
                <div className="flex h-full w-full items-center justify-center text-muted-foreground gap-2">
                  <Loader2 className="h-5 w-5 animate-spin" /> Loading location map...
                </div>
              ) : (
                <iframe
                  title={`Inspection Map for ${report?.id || "Site"}`}
                  src={mapUrl}
                  className="h-full w-full border-0"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              )}

              {/* Map Floating Floating Quick Navigation Button */}
              <a
                href={directionsUrl}
                target="_blank"
                rel="noreferrer"
                className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-lg bg-card/90 px-3 py-1.5 text-xs font-medium text-foreground shadow-md backdrop-blur-md border border-border hover:bg-card transition-colors"
              >
                <Navigation className="h-3.5 w-3.5 text-primary" />
                Navigate Here
              </a>
            </div>
          </div>

          {/* Citizen & Location Details Card */}
          <div className="soft-shadow rounded-2xl border border-border bg-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-foreground">Citizen &amp; Site Details</h3>
              <span className="text-xs text-muted-foreground">ID: {report?.id}</span>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex items-start gap-3 rounded-xl bg-muted/40 p-3">
                <User className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <div className="min-w-0">
                  <div className="text-xs text-muted-foreground">Citizen Name</div>
                  <div className="truncate text-sm font-medium text-foreground">{citizenName}</div>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-xl bg-muted/40 p-3">
                <Phone className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <div className="min-w-0">
                  <div className="text-xs text-muted-foreground">Mobile Contact</div>
                  <a
                    href={`tel:${citizenMobile}`}
                    className="truncate text-sm font-medium text-primary hover:underline"
                  >
                    {citizenMobile}
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-xl bg-muted/40 p-3">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <div className="min-w-0">
                  <div className="text-xs text-muted-foreground">Site Address</div>
                  <div className="text-sm font-medium text-foreground line-clamp-2">{siteAddress}</div>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-xl bg-muted/40 p-3">
                <Navigation className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <div className="min-w-0">
                  <div className="text-xs text-muted-foreground">GPS Location</div>
                  <div className="truncate text-sm font-medium font-mono text-foreground">
                    {lat.toFixed(4)}° N, {lng.toFixed(4)}° E
                  </div>
                </div>
              </div>
            </div>

            {/* Citizen Observation Callout */}
            {report?.description && (
              <div className="mt-4 rounded-xl border border-border/80 bg-muted/20 p-3.5">
                <div className="text-xs font-semibold text-foreground mb-1">
                  Citizen Observation / AI Detection:
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {report.description}
                </p>
              </div>
            )}

            {/* Evidence Thumbnail if available */}
            {photoUrl && (
              <div className="mt-4 flex items-center gap-3 p-3 rounded-xl border border-border bg-card">
                <img
                  src={photoUrl}
                  alt={`Evidence for ${report?.id}`}
                  className="h-16 w-16 object-cover rounded-lg border border-border bg-slate-900"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-semibold text-foreground">Uploaded Hazard Photo</div>
                  <div className="text-[11px] text-muted-foreground truncate">
                    Breeding evidence detected by citizen
                  </div>
                  {report?.id && (
                    <Link
                      to={`/phi/reports/${report.id}`}
                      className="text-xs font-medium text-primary hover:underline inline-flex items-center gap-1 mt-1"
                    >
                      Inspect with YOLO bounding box <ExternalLink className="h-3 w-3" />
                    </Link>
                  )}
                </div>
              </div>
            )}

            {/* Open in Maps Direction Button */}
            <div className="mt-4 flex flex-wrap gap-2">
              <Button
                as="a"
                href={directionsUrl}
                target="_blank"
                rel="noreferrer"
                className="bg-primary hover:bg-primary/90 text-white"
              >
                <Navigation className="h-4 w-4" /> Open in Maps (Directions)
              </Button>

              <Button
                as="a"
                href={`https://maps.google.com/maps?q=${lat},${lng}`}
                target="_blank"
                rel="noreferrer"
                variant="outline"
              >
                <ExternalLink className="h-4 w-4" /> Google Maps Pin
              </Button>
            </div>
          </div>
        </div>

        {/* Right Column: Visit Checklist & Status Update */}
        <div className="space-y-6">
          {/* Visit Checklist Card */}
          <div className="soft-shadow rounded-2xl border border-border bg-card p-5">
            <h3 className="mb-4 flex items-center gap-2 font-semibold text-foreground">
              <ClipboardCheck className="h-5 w-5 text-primary" /> Visit Checklist
            </h3>
            <div className="space-y-3">
              {VISIT_CHECKLIST.map((item) => (
                <div
                  key={item}
                  className="flex items-center gap-3 rounded-xl border border-border p-3 transition-colors hover:bg-muted/30"
                >
                  <Checkbox
                    id={item}
                    checked={Boolean(checked[item])}
                    onChange={(event) =>
                      setChecked((current) => ({ ...current, [item]: event.target.checked }))
                    }
                  />
                  <Label htmlFor={item} className="flex-1 cursor-pointer font-normal text-sm text-foreground">
                    {item}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Update Status Card */}
          <div className="soft-shadow rounded-2xl border border-border bg-card p-5">
            <h3 className="mb-4 font-semibold text-foreground">Update Status</h3>
            <div className="space-y-3">
              <div>
                <Label className="text-xs text-muted-foreground mb-1">Inspection Decision / State</Label>
                <Select
                  value={statusVal}
                  onChange={(e) => setStatusVal(e.target.value)}
                  options={REPORT_STATUSES}
                />
              </div>

              <div>
                <Label className="text-xs text-muted-foreground mb-1">Inspection Comments &amp; Notes</Label>
                <Textarea
                  placeholder="Record larval density observations, larvicide chemicals used, or actions taken…"
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  className="min-h-[100px]"
                />
              </div>

              <Button
                className="w-full bg-primary hover:bg-primary/90 text-white font-medium"
                disabled={saving || !report?.id}
                onClick={handleSaveUpdate}
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Saving Update…
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" /> Save Update
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
