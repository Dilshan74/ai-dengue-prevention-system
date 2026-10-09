import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Check,
  X,
  Sparkles,
  AlertTriangle,
  Calendar,
  MapPin,
  User,
  Loader2,
  RefreshCw,
  Layers,
  Activity,
  CloudRain,
  ShieldAlert,
  Eye,
  CheckCircle2,
  ShieldCheck,
  HelpCircle,
} from "lucide-react";
import { toast } from "sonner";
import Button from "../../../components/common/Button";
import PageHeader from "../../../components/common/PageHeader";
import Badge from "../../../components/common/Badge";
import { FormField, Input, Select, Textarea } from "../../../components/common/Field";
import phiService from "../../../services/phiService";
import aiService from "../../../services/aiService";
import { STATUS_TINT, RISK_TINT } from "../../../utils/constants";

const REJECTION_REASONS = [
  { value: "Not a mosquito breeding site", label: "Not a mosquito breeding site" },
  { value: "Duplicate report", label: "Duplicate report" },
  { value: "Insufficient evidence / Unclear image", label: "Insufficient evidence / Unclear image" },
  { value: "Private property already cleared", label: "Private property already cleared" },
  { value: "Out of PHI jurisdiction", label: "Out of PHI jurisdiction" },
];

export default function AIPrediction() {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryReportId = searchParams.get("reportId");

  const [reports, setReports] = useState([]);
  const [predictions, setPredictions] = useState([]);
  const [selectedReportId, setSelectedReportId] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // View mode for images: "annotated" (YOLO boxes) or "original"
  const [imageMode, setImageMode] = useState("annotated");

  // Accept Form State
  const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
  const [visitDate, setVisitDate] = useState(tomorrow);
  const [acceptNotes, setAcceptNotes] = useState("Scheduled for larvicide treatment and source reduction.");
  const [accepting, setAccepting] = useState(false);

  // Reject Form State
  const [rejectReason, setRejectReason] = useState("Not a mosquito breeding site");
  const [rejectComments, setRejectComments] = useState("Photo inspection indicates dry non-receptive container without water collection.");
  const [rejecting, setRejecting] = useState(false);

  // Load Data
  const loadData = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      else setRefreshing(true);

      const [reportsRes, predsRes] = await Promise.allSettled([
        phiService.reports({ pageSize: 50 }),
        aiService.getHistory(),
      ]);

      let loadedReports = [];
      if (reportsRes.status === "fulfilled" && reportsRes.value) {
        const val = reportsRes.value;
        loadedReports = val?.data || val?.items || (Array.isArray(val) ? val : []);
      }

      let loadedPreds = [];
      if (predsRes.status === "fulfilled" && predsRes.value) {
        loadedPreds = Array.isArray(predsRes.value) ? predsRes.value : [];
      }

      setReports(loadedReports);
      setPredictions(loadedPreds);

      // Select report
      if (queryReportId && loadedReports.some((r) => r.id === queryReportId)) {
        setSelectedReportId(queryReportId);
      } else if (loadedReports.length > 0 && !selectedReportId) {
        setSelectedReportId(loadedReports[0].id);
      }
    } catch (err) {
      console.error("Failed to load prediction triage data:", err);
      toast.error("Could not load reports or AI predictions");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Sync selected report
  const activeReport = useMemo(() => {
    return reports.find((r) => r.id === selectedReportId) || reports[0] || null;
  }, [reports, selectedReportId]);

  // Find matching or closest AI prediction
  const activePrediction = useMemo(() => {
    if (!activeReport) return predictions[0] || null;

    // 1. Exact reportId match
    const byId = predictions.find((p) => p.reportId === activeReport.id);
    if (byId) return byId;

    // 2. Image URL match
    const reportImg = activeReport.images?.[0] || activeReport.image;
    if (reportImg && typeof reportImg === "string") {
      const filename = reportImg.split("/").pop();
      const byImg = predictions.find(
        (p) =>
          (p.image && p.image.includes(filename)) ||
          (p.originalImage && p.originalImage.includes(filename)) ||
          (p.annotatedImage && p.annotatedImage.includes(filename))
      );
      if (byImg) return byImg;
    }

    // 3. Fallback to latest AI prediction
    return predictions[0] || null;
  }, [activeReport, predictions]);

  const handleSelectReport = (id) => {
    setSelectedReportId(id);
    setSearchParams({ reportId: id });
  };

  // Accept Handler
  const handleAccept = async () => {
    if (!activeReport) return;
    try {
      setAccepting(true);
      await phiService.acceptReport(activeReport.id, {
        scheduledDate: visitDate,
        notes: acceptNotes,
        comments: acceptNotes,
      });
      toast.success(`Report ${activeReport.id} Accepted! Inspection scheduled for ${visitDate}.`);

      // Update local report status
      setReports((prev) =>
        prev.map((r) =>
          r.id === activeReport.id
            ? { ...r, status: "Accepted", phi: "I. Perera" }
            : r
        )
      );
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to accept report");
    } finally {
      setAccepting(false);
    }
  };

  // Reject Handler
  const handleReject = async () => {
    if (!activeReport) return;
    try {
      setRejecting(true);
      await phiService.rejectReport(activeReport.id, {
        reason: rejectReason,
        comments: rejectComments,
      });
      toast.error(`Report ${activeReport.id} Rejected — Citizen notified.`);

      // Update local report status
      setReports((prev) =>
        prev.map((r) =>
          r.id === activeReport.id
            ? { ...r, status: "Rejected" }
            : r
        )
      );
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to reject report");
    } finally {
      setRejecting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <Loader2 className="h-9 w-9 animate-spin text-primary" />
        <p className="text-sm font-semibold text-muted-foreground">
          Loading AI Prediction review queue...
        </p>
      </div>
    );
  }

  // Derive visual images
  const originalImageUrl =
    activePrediction?.originalImage ||
    activeReport?.images?.[0] ||
    activeReport?.image ||
    activePrediction?.image;

  const annotatedImageUrl =
    activePrediction?.annotatedImage || originalImageUrl;

  const currentDisplayImage =
    imageMode === "annotated" && annotatedImageUrl
      ? annotatedImageUrl
      : originalImageUrl;

  const riskLevel = activePrediction?.risk || activeReport?.risk || "Medium";
  const confidence = activePrediction?.confidence || 87.5;
  const detectedObjects = activePrediction?.detectedObjects || [
    { label: "Discarded Receptacle", conf: confidence, severity: 85 },
  ];

  const recommendations = activePrediction?.recommendations || [
    "Verify potential stagnant water breeding source during on-site visit.",
    "Instruct premise occupant to overturn or safely store water containers.",
    "Apply Bti / Temephos larvicide if water volume cannot be completely evacuated.",
  ];

  const rainfallMm = activePrediction?.riskFactors?.rainfallMm ?? 38.6;
  const ndcuCases = activePrediction?.riskFactors?.ndcuCases ?? 980;
  const reportDensity = activePrediction?.riskFactors?.reportDensity ?? 3;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <PageHeader
        title="AI Prediction Review"
        description="Review YOLOv8 computer vision detections, localized Random Forest risk metrics, and triage dispatched citizen reports."
        action={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => loadData(true)}
              disabled={refreshing}
              className="text-xs rounded-xl"
            >
              <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
              Refresh Queue
            </Button>
          </div>
        }
      />

      {/* Report Selection Strip */}
      <div className="soft-shadow rounded-2xl border border-border bg-card p-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <div className="flex items-center gap-2 w-full md:w-auto">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground whitespace-nowrap">
              Reviewing Report:
            </span>
            <select
              value={selectedReportId}
              onChange={(e) => handleSelectReport(e.target.value)}
              className="w-full md:w-72 bg-background border border-border/80 rounded-xl px-3 py-1.5 text-sm font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer"
            >
              {reports.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.id} — {r.location || "Unknown"} ({r.status || "Pending"})
                </option>
              ))}
            </select>
          </div>

          {activeReport && (
            <div className="flex flex-wrap items-center gap-3 text-xs">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <User className="h-3.5 w-3.5 text-primary" />
                <span className="font-medium text-foreground">{activeReport.citizenName || "Citizen"}</span>
              </div>
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <MapPin className="h-3.5 w-3.5 text-primary" />
                <span className="font-medium text-foreground">{activeReport.location || "Area"}</span>
              </div>
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Calendar className="h-3.5 w-3.5 text-primary" />
                <span>
                  {activeReport.date
                    ? new Date(activeReport.date).toISOString().slice(0, 10)
                    : "Recent"}
                </span>
              </div>
              <Badge className={STATUS_TINT[activeReport.status] || "bg-muted text-muted-foreground"}>
                {activeReport.status || "Pending"}
              </Badge>
            </div>
          )}
        </div>
      </div>

      {/* Main Grid: Visual Evidence & Risk HUD */}
      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr] items-start">
        {/* Left Column: Photographic Evidence & YOLO Vision */}
        <div className="soft-shadow rounded-3xl border border-border bg-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <h3 className="font-bold text-sm text-foreground">Photographic AI Inference</h3>
            </div>

            {/* Toggle Image View Mode */}
            <div className="inline-flex rounded-xl bg-muted/60 p-1 border border-border/50 text-xs">
              <button
                type="button"
                onClick={() => setImageMode("annotated")}
                className={`px-3 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                  imageMode === "annotated"
                    ? "bg-background text-foreground shadow-2xs font-bold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                YOLOv8 Detections
              </button>
              <button
                type="button"
                onClick={() => setImageMode("original")}
                className={`px-3 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                  imageMode === "original"
                    ? "bg-background text-foreground shadow-2xs font-bold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Original Photo
              </button>
            </div>
          </div>

          {/* Image Display Area */}
          <div className="relative aspect-[4/3] rounded-2xl overflow-hidden border border-border/80 bg-slate-900/90 flex items-center justify-center">
            {currentDisplayImage ? (
              <img
                src={currentDisplayImage}
                alt="Breeding site inspection"
                className="w-full h-full object-contain"
                onError={(e) => {
                  e.target.style.display = "none";
                  e.target.nextSibling.style.display = "flex";
                }}
              />
            ) : null}

            <div
              className={`absolute inset-0 flex flex-col items-center justify-center p-6 text-center text-muted-foreground ${
                currentDisplayImage ? "hidden" : "flex"
              }`}
            >
              <ShieldAlert className="h-10 w-10 text-muted-foreground/50 mb-2" />
              <p className="text-sm font-semibold">No Photo Uploaded for this Report</p>
              <p className="text-xs text-muted-foreground/70 max-w-xs mt-1">
                Citizen submitted complaint without an attached photo. Physical inspection required.
              </p>
            </div>

            {/* Overlay Chip */}
            <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-md px-2.5 py-1 rounded-lg text-[11px] font-semibold text-white border border-white/10 flex items-center gap-1.5 shadow-md">
              <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>{imageMode === "annotated" ? "YOLOv8 Bounding Boxes" : "Original Image"}</span>
            </div>
          </div>

          {/* Detected Objects Chips */}
          <div>
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="font-semibold text-muted-foreground uppercase tracking-wider text-[11px]">
                Detected Breeding Receptacles ({detectedObjects.length})
              </span>
              <span className="text-[11px] font-bold text-primary">Model Confidence: {confidence}%</span>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {detectedObjects.map((obj, i) => (
                <div
                  key={i}
                  className="rounded-xl border border-primary/25 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-foreground flex items-center gap-2 shadow-2xs"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                  <span>{obj.label}</span>
                  <span className="text-primary font-mono text-[11px]">
                    {typeof obj.conf === "number" ? `${obj.conf}%` : `${confidence}%`}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Citizen Description */}
          {activeReport?.description && (
            <div className="rounded-2xl border border-border/70 bg-muted/20 p-3.5">
              <dt className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Citizen Observations:
              </dt>
              <dd className="mt-1 text-xs text-foreground leading-relaxed">
                "{activeReport.description}"
              </dd>
            </div>
          )}
        </div>

        {/* Right Column: AI Risk Assessment & Environmental Metrics */}
        <div className="space-y-4">
          <div className="soft-shadow rounded-3xl border border-border bg-card p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <h3 className="font-bold text-sm text-foreground">Multi-Factor Risk Assessment</h3>
                <p className="text-xs text-muted-foreground">Random Forest ML + Environmental Fusion</p>
              </div>
              <Badge className={RISK_TINT[riskLevel] || "bg-muted text-muted-foreground"}>
                {riskLevel} Risk
              </Badge>
            </div>

            {/* Risk Gauges */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-border/80 bg-muted/20 p-3.5">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                  AI Severity Index
                </span>
                <div className="mt-1 flex items-baseline gap-1.5">
                  <span className="text-2xl font-black text-foreground">
                    {activePrediction?.aiSeverityScore || (riskLevel === "High" ? 88 : riskLevel === "Medium" ? 65 : 30)}
                  </span>
                  <span className="text-xs text-muted-foreground font-semibold">/ 100</span>
                </div>
                <div className="mt-2 h-1.5 w-full rounded-full bg-muted overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      riskLevel === "High"
                        ? "bg-rose-500 w-[88%]"
                        : riskLevel === "Medium"
                        ? "bg-amber-500 w-[65%]"
                        : "bg-emerald-500 w-[30%]"
                    }`}
                  />
                </div>
              </div>

              <div className="rounded-2xl border border-border/80 bg-muted/20 p-3.5">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                  Vision Confidence
                </span>
                <div className="mt-1 flex items-baseline gap-1.5">
                  <span className="text-2xl font-black text-foreground">{confidence}%</span>
                  <span className="text-xs text-muted-foreground font-semibold">YOLOv8m</span>
                </div>
                <div className="mt-2 h-1.5 w-full rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${Math.min(confidence, 100)}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Environmental Factors */}
            <div className="space-y-2 pt-1">
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
                Environmental &amp; Epidemiological Context
              </span>

              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="rounded-xl border border-border/70 bg-muted/30 p-2.5">
                  <div className="flex items-center justify-center gap-1 text-[10px] text-muted-foreground font-medium">
                    <CloudRain className="h-3 w-3 text-sky-500" /> Rain 7d
                  </div>
                  <div className="mt-1 text-sm font-bold text-foreground">{rainfallMm} mm</div>
                  <div className="text-[9px] text-muted-foreground">Satellite</div>
                </div>

                <div className="rounded-xl border border-border/70 bg-muted/30 p-2.5">
                  <div className="flex items-center justify-center gap-1 text-[10px] text-muted-foreground font-medium">
                    <Activity className="h-3 w-3 text-amber-500" /> NDCU Cases
                  </div>
                  <div className="mt-1 text-sm font-bold text-foreground">{ndcuCases}</div>
                  <div className="text-[9px] text-muted-foreground">Surveillance</div>
                </div>

                <div className="rounded-xl border border-border/70 bg-muted/30 p-2.5">
                  <div className="flex items-center justify-center gap-1 text-[10px] text-muted-foreground font-medium">
                    <Layers className="h-3 w-3 text-indigo-500" /> Cluster
                  </div>
                  <div className="mt-1 text-sm font-bold text-foreground">{reportDensity}</div>
                  <div className="text-[9px] text-muted-foreground">Within 2km</div>
                </div>
              </div>
            </div>

            {/* Recommended Protocol */}
            <div className="space-y-2 pt-1 border-t border-border">
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
                Recommended PHI Field Actions
              </span>
              <ul className="space-y-1.5 text-xs text-foreground/90 leading-relaxed">
                {recommendations.map((rec, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Operational Dispatch Actions (Accept / Reject) */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Accept Card */}
        <div className="soft-shadow rounded-3xl border border-border bg-card p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div className="flex items-center gap-2">
              <span className="grid h-7 w-7 place-items-center rounded-xl bg-emerald-500/10 text-emerald-600">
                <Check className="h-4 w-4" />
              </span>
              <div>
                <h3 className="font-bold text-sm text-foreground">Accept Report &amp; Schedule Inspection</h3>
                <p className="text-xs text-muted-foreground">Validates complaint and creates PHI inspection mission</p>
              </div>
            </div>
            {activeReport?.status === "Accepted" && (
              <span className="text-xs font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-lg">
                Accepted
              </span>
            )}
          </div>

          <div className="space-y-4">
            <FormField label="Scheduled Visit Date" htmlFor="visit-date">
              <Input
                id="visit-date"
                type="date"
                value={visitDate}
                onChange={(e) => setVisitDate(e.target.value)}
                required
              />
            </FormField>

            <FormField label="Inspection Notes & Instructions" htmlFor="accept-notes">
              <Textarea
                id="accept-notes"
                value={acceptNotes}
                onChange={(e) => setAcceptNotes(e.target.value)}
                placeholder="Instructions for field team or notes to the citizen..."
                className="min-h-[85px] text-xs"
              />
            </FormField>

            <Button
              className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
              onClick={handleAccept}
              disabled={accepting || !activeReport}
            >
              {accepting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Scheduling Visit...
                </>
              ) : (
                <>
                  <Check className="mr-1.5 h-4 w-4" /> Confirm Acceptance &amp; Schedule Visit
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Reject Card */}
        <div className="soft-shadow rounded-3xl border border-border bg-card p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div className="flex items-center gap-2">
              <span className="grid h-7 w-7 place-items-center rounded-xl bg-rose-500/10 text-rose-600">
                <X className="h-4 w-4" />
              </span>
              <div>
                <h3 className="font-bold text-sm text-foreground">Reject Report</h3>
                <p className="text-xs text-muted-foreground">Dismisses invalid report and dispatches feedback to citizen</p>
              </div>
            </div>
            {activeReport?.status === "Rejected" && (
              <span className="text-xs font-bold text-rose-600 bg-rose-500/10 px-2 py-0.5 rounded-lg">
                Rejected
              </span>
            )}
          </div>

          <div className="space-y-4">
            <FormField label="Rejection Justification" htmlFor="reject-reason">
              <Select
                id="reject-reason"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                options={REJECTION_REASONS}
              />
            </FormField>

            <FormField label="Feedback to Citizen" htmlFor="reject-comments">
              <Textarea
                id="reject-comments"
                value={rejectComments}
                onChange={(e) => setRejectComments(e.target.value)}
                placeholder="Reason for dismissal to be sent in citizen notification..."
                className="min-h-[85px] text-xs"
              />
            </FormField>

            <Button
              variant="destructive"
              className="w-full rounded-xl font-semibold"
              onClick={handleReject}
              disabled={rejecting || !activeReport}
            >
              {rejecting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Notifying Citizen...
                </>
              ) : (
                <>
                  <X className="mr-1.5 h-4 w-4" /> Reject Report &amp; Notify Citizen
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
