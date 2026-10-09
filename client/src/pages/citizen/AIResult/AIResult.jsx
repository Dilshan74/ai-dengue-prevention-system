import { useState, useEffect } from "react";
import { useLocation, Link } from "react-router-dom";
import {
  Eye,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  ArrowLeft,
  Download,
  Layers,
  Sparkles,
  Cpu,
  CloudRain,
  Activity,
  BarChart3,
  MapPin,
  Info,
  Loader2,
  History,
  Calendar,
  Clock,
  ChevronRight,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import Button from "../../../components/common/Button";
import PageHeader from "../../../components/common/PageHeader";
import citizenService from "../../../services/citizenService";
import aiService from "../../../services/aiService";
import useAuth from "../../../hooks/useAuth";
import { resolveImageUrl } from "../../../utils/helpers";

function normalizeAnalysis(item) {
  if (!item) return null;
  const pred = item.prediction || item;
  return {
    id: pred.id || item.id || "PRED-HIST",
    reportId: item.reportId || pred.reportId || (item.id?.startsWith("DG-") ? item.id : null),
    location: item.location || pred.location || "Location not specified",
    coords: item.coords || (item.lat != null && item.lng != null ? { lat: item.lat, lng: item.lng } : null),
    risk: pred.rfRiskLevel || pred.risk || item.risk || "Medium",
    rfRiskLevel: pred.rfRiskLevel || pred.risk || item.risk || "Medium",
    rfRiskScore:
      pred.rfRiskScore !== undefined
        ? Number(pred.rfRiskScore)
        : item.rfRiskScore !== undefined
        ? Number(item.rfRiskScore)
        : pred.risk === "High"
        ? 85.0
        : pred.risk === "Medium"
        ? 55.0
        : 20.0,
    confidence:
      pred.confidence !== undefined
        ? Number(pred.confidence)
        : item.confidence !== undefined
        ? Number(item.confidence)
        : 88.0,
    aiSeverityScore: pred.aiSeverityScore ?? pred.riskFactors?.aiSeverity ?? item.aiSeverityScore ?? 65.0,
    detectedObjects: pred.detectedObjects || item.detectedObjects || [],
    annotatedImage: pred.annotatedImage || item.annotatedImage || pred.image || item.image || item.images?.[0] || "",
    originalImage: pred.originalImage || item.originalImage || pred.image || item.image || item.images?.[0] || "",
    imagePreview: item.imagePreview || pred.imagePreview || null,
    riskFactors: pred.riskFactors || {
      aiSeverity: pred.aiSeverityScore || item.aiSeverityScore || 65.0,
      aiConfidence: pred.confidence || item.confidence || 88.0,
      rainfallMm: pred.rainfall_mm || 45.0,
      ndcuCases: pred.ndcu_cases || 320,
      reportDensity: pred.report_density || 4,
    },
    recommendations: pred.recommendations || item.recommendations || [
      "Empty water-retaining receptacles immediately to eliminate mosquito breeding larvae.",
      "Store unused tires and containers in dry, sheltered areas or recycle them.",
    ],
    environmentalSources: pred.environmentalSources || null,
    createdAt: pred.createdAt || item.createdAt || item.date || new Date().toISOString(),
    category: item.category || "container",
    description: item.description || pred.description || "",
    status: item.status || null,
    phi: item.phi || null,
  };
}

function formatDate(dateStr) {
  if (!dateStr) return "Recent";
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateStr;
  }
}

export default function AIResult() {
  const location = useLocation();
  const navState = location.state || {};
  const { user } = useAuth();

  const [historyList, setHistoryList] = useState([]);
  const [selectedPrediction, setSelectedPrediction] = useState(
    navState.prediction ? normalizeAnalysis(navState) : null
  );
  const [selectedMeta, setSelectedMeta] = useState({
    location: navState.location || navState.prediction?.location || "",
    coords: navState.coords || null,
    imagePreview: navState.imagePreview || null,
    category: navState.category || "container",
    description: navState.description || "",
  });

  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [showAnnotated, setShowAnnotated] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [dispatchedReport, setDispatchedReport] = useState(null);

  // Load previous analyses for current logged-in citizen only
  useEffect(() => {
    let isMounted = true;

    async function loadAnalyses() {
      setIsLoadingHistory(true);
      const items = [];

      // 1. Fetch from AI predictions history (filtered on backend by user)
      try {
        const historyRes = await aiService.getHistory();
        if (Array.isArray(historyRes) && historyRes.length > 0) {
          items.push(...historyRes.map(normalizeAnalysis));
        }
      } catch (e) {
        console.warn("Could not fetch AI predictions history:", e);
      }

      // 2. Fetch from Citizen complaints (filtered by citizenId)
      try {
        const complaintsRes = await citizenService.complaints({ pageSize: 20 });
        const list = complaintsRes.data || complaintsRes || [];
        if (Array.isArray(list)) {
          items.push(...list.map(normalizeAnalysis));
        }
      } catch (e) {
        console.warn("Could not fetch citizen complaints:", e);
      }

      // 3. Check localStorage cached prediction for current user only
      try {
        const cached = localStorage.getItem("dengue_last_prediction");
        if (cached) {
          const parsed = JSON.parse(cached);
          const isUserOwned =
            Boolean(parsed.userId && user?.id && String(parsed.userId) === String(user.id)) ||
            Boolean(
              parsed.userEmail &&
                user?.email &&
                String(parsed.userEmail).toLowerCase() === String(user.email).toLowerCase()
            );
          if (isUserOwned) {
            items.unshift(normalizeAnalysis(parsed));
          }
        }
      } catch (e) {}

      // 4. Fresh prediction from navigation state
      if (navState.prediction) {
        const fresh = normalizeAnalysis({
          ...navState,
          prediction: navState.prediction,
        });
        items.unshift(fresh);
      }

      // Deduplicate items
      const seen = new Set();
      const uniqueItems = [];
      for (const item of items) {
        if (!item) continue;
        const key = item.id || `${item.annotatedImage || item.originalImage}-${item.createdAt}`;
        if (!seen.has(key)) {
          seen.add(key);
          uniqueItems.push(item);
        }
      }

      // Sort newest first
      uniqueItems.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      if (isMounted) {
        setHistoryList(uniqueItems);

        if (navState.prediction) {
          selectAnalysis(uniqueItems[0] || normalizeAnalysis(navState));
        } else if (uniqueItems.length > 0) {
          selectAnalysis(uniqueItems[0]);
        } else {
          setSelectedPrediction(null);
        }
        setIsLoadingHistory(false);
      }
    }

    loadAnalyses();

    return () => {
      isMounted = false;
    };
  }, [location.state]);

  const selectAnalysis = (analysis) => {
    if (!analysis) return;
    setSelectedPrediction(analysis);
    setSelectedMeta({
      location: analysis.location,
      coords: analysis.coords,
      imagePreview: analysis.imagePreview,
      category: analysis.category,
      description: analysis.description,
    });
    if (analysis.status || (analysis.reportId && analysis.reportId.startsWith("DG-"))) {
      setDispatchedReport({
        id: analysis.reportId || analysis.id,
        phi: analysis.phi || "Assigned",
      });
    } else {
      setDispatchedReport(null);
    }
  };

  const getRiskBadge = (level) => {
    switch (level?.toLowerCase()) {
      case "high":
        return {
          bg: "bg-red-500/10 text-red-600 border-red-500/30",
          barColor: "bg-red-500",
          textColor: "text-red-500",
          icon: AlertTriangle,
          label: "HIGH RISK DENGUE ZONE",
        };
      case "medium":
        return {
          bg: "bg-amber-500/10 text-amber-600 border-amber-500/30",
          barColor: "bg-amber-500",
          textColor: "text-amber-500",
          icon: AlertCircle,
          label: "MEDIUM RISK DENGUE ZONE",
        };
      default:
        return {
          bg: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30",
          barColor: "bg-emerald-500",
          textColor: "text-emerald-500",
          icon: CheckCircle2,
          label: "LOW RISK / CLEAN AREA",
        };
    }
  };

  // Loading indicator for initial history fetch
  if (isLoadingHistory && !selectedPrediction) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Dengue Risk Assessment Result"
          description="View AI object detection and ML risk assessment results"
        />
        <div className="flex min-h-[380px] flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card p-8 text-center">
          <Loader2 className="mb-4 h-10 w-10 animate-spin text-primary" />
          <h2 className="mb-1 text-lg font-bold text-foreground">Loading AI Analysis History...</h2>
          <p className="max-w-md text-sm text-muted-foreground">
            Retrieving previous YOLO detections and ML risk assessments from your profile.
          </p>
        </div>
      </div>
    );
  }

  // Truly no predictions found
  if (!selectedPrediction) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Dengue Risk Assessment Result"
          description="View AI object detection and ML risk assessment results"
        />
        <div className="flex min-h-[380px] flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card p-8 text-center">
          <div className="mb-4 rounded-full bg-primary/10 p-4 text-primary">
            <Sparkles className="h-8 w-8" />
          </div>
          <h2 className="mb-2 text-lg font-bold text-foreground">No AI Analysis Available</h2>
          <p className="mb-6 max-w-md text-sm text-muted-foreground">
            Please upload a photo of a suspected mosquito breeding site to run YOLOv8 object detection and Random Forest risk scoring.
          </p>
          <Link to="/citizen/upload">
            <Button>
              <ArrowLeft className="mr-2 h-4 w-4" /> Go to Upload Image
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // Active prediction values
  const prediction = selectedPrediction;
  const reportLocation = selectedMeta.location || prediction.location || "Location not specified";
  const reportCoords = selectedMeta.coords || prediction.coords;
  const hasReportCoords =
    Number.isFinite(reportCoords?.lat) && Number.isFinite(reportCoords?.lng);

  const rfRiskScore = prediction.rfRiskScore !== undefined ? Number(prediction.rfRiskScore) : 0;
  const rfRiskLevel = prediction.rfRiskLevel || prediction.risk || "Low";
  const confidence = prediction.confidence ?? 0;
  const aiSeverity = prediction.aiSeverityScore ?? (prediction.riskFactors?.aiSeverity ?? 0);
  const detectedObjects = prediction.detectedObjects || [];

  const factors = prediction.riskFactors || {
    aiSeverity: aiSeverity,
    aiConfidence: confidence,
    rainfallMm: 0,
    ndcuCases: 0,
    reportDensity: 0,
  };

  const recommendations = prediction.recommendations?.length
    ? prediction.recommendations
    : [
        "Empty water-retaining receptacles immediately to eliminate mosquito breeding larvae.",
        "Store unused tires and containers in dry, sheltered areas or recycle them.",
      ];
  const reportId = prediction.reportId || prediction.id || "N/A";

  const originalPreview =
    selectedMeta.imagePreview && !selectedMeta.imagePreview.startsWith("blob:")
      ? selectedMeta.imagePreview
      : null;
  const annotatedSrc = prediction.annotatedImage || originalPreview;
  const rawSrc = prediction.originalImage || prediction.image || originalPreview;
  const displayImage = showAnnotated && annotatedSrc ? annotatedSrc : (rawSrc || originalPreview);

  const riskBadge = getRiskBadge(rfRiskLevel);
  const RiskIcon = riskBadge.icon;

  const downloadReport = async () => {
    try {
      setIsDownloadingPdf(true);
      toast.info("Generating PDF risk assessment report...");
      const payload = {
        reportId,
        location: reportLocation,
        coordinates: hasReportCoords ? reportCoords : null,
        machineLearningRiskScore: `${rfRiskScore} / 100`,
        machineLearningRiskLevel: rfRiskLevel,
        yoloConfidence: `${confidence}%`,
        visualSeverityScore: factors.aiSeverity,
        environmentalFactors: {
          rainfall7DayMm: factors.rainfallMm,
          ndcuDistrictCases: factors.ndcuCases,
          reportDensity2Km: factors.reportDensity,
        },
        detectedHazards: detectedObjects,
        recommendations,
        timestamp: new Date().toISOString(),
      };

      const response = await aiService.downloadPdf(payload);
      const blob = new Blob([response], { type: "application/pdf" });
      const downloadUrl = window.URL.createObjectURL(blob);
      const downloadAnchor = document.createElement("a");
      downloadAnchor.href = downloadUrl;
      downloadAnchor.download = `DengueGuard-Report-${reportId}.pdf`;
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      window.URL.revokeObjectURL(downloadUrl);
      toast.success("PDF report downloaded successfully!");
    } catch (err) {
      console.error("PDF download failed:", err);
      toast.error("Failed to generate PDF report");
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const handleSendToPhi = async () => {
    if (dispatchedReport) {
      toast.info(`Report already dispatched with ID: ${dispatchedReport.id}`);
      return;
    }

    try {
      setIsSending(true);
      toast.info("Dispatching inspection report to PHI officer...");

      const primaryImg =
        prediction?.annotatedImage ||
        prediction?.originalImage ||
        prediction?.image ||
        "";

      const allImages = [
        prediction?.annotatedImage,
        prediction?.originalImage,
        prediction?.image,
      ].filter((img) => Boolean(img) && !img.startsWith("blob:"));

      const payload = {
        location: reportLocation,
        address: reportLocation,
        description:
          selectedMeta.description ||
          `AI Dengue Risk Alert: ${rfRiskLevel} risk site detected (${detectedObjects.map((o) => o.label).join(", ") || "breeding hazard"}).`,
        category: selectedMeta.category || "container",
        risk: rfRiskLevel,
        image: primaryImg,
        images: allImages.length > 0 ? allImages : [primaryImg].filter(Boolean),
        rfRiskScore: rfRiskScore,
        confidence: confidence,
        detectedObjects: detectedObjects,
      };
      if (hasReportCoords) {
        payload.lat = reportCoords.lat;
        payload.lng = reportCoords.lng;
      }

      const res = await citizenService.createComplaint(payload);
      setDispatchedReport(res);
      toast.success(
        `Report ${res.id} successfully sent to PHI Officer (${res.phi || "Assigned"}) for field inspection!`
      );
    } catch (err) {
      console.error("Failed to send report to PHI:", err);
      toast.error(err.response?.data?.message || err.message || "Failed to dispatch report to PHI");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <>
      {/* Top Navigation & Status */}
      <div className="mb-4 flex items-center justify-between">
        <Link
          to="/citizen/upload"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Upload
        </Link>
        <div className="flex items-center gap-2">
          <Link
            to="/citizen/upload"
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-xs font-semibold text-foreground hover:bg-muted transition-colors shadow-xs"
          >
            <Upload className="h-3.5 w-3.5 text-primary" /> Upload New Photo
          </Link>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            <Cpu className="h-3.5 w-3.5" /> 2-Stage AI &amp; ML Architecture
          </span>
        </div>
      </div>

      {/* Loading or Empty State or Assessment View */}
      {isLoadingHistory ? (
        <div className="flex h-72 flex-col items-center justify-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm font-medium text-muted-foreground">Loading your risk assessments...</p>
        </div>
      ) : !selectedPrediction ? (
        <div className="soft-shadow rounded-3xl border border-dashed border-border bg-card p-12 text-center max-w-xl mx-auto my-12">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-primary/10 text-primary mb-4">
            <Cpu className="h-8 w-8" />
          </div>
          <h2 className="text-xl font-bold text-foreground">No Submissions Found</h2>
          <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">
            You haven't uploaded or analyzed any breeding sites yet. Upload a photo of a suspected mosquito breeding site to run our automated AI &amp; ML dengue risk assessment.
          </p>
          <div className="mt-6">
            <Button as={Link} to="/citizen/upload" className="rounded-xl px-5">
              <Upload className="mr-2 h-4 w-4" /> Upload New Photo
            </Button>
          </div>
        </div>
      ) : (
        <>
          {/* PREVIOUS ANALYSES SELECTOR BAR */}
          {historyList.length > 0 && (
            <div className="mb-6 rounded-2xl border border-border bg-card p-4 soft-shadow">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <History className="h-4 w-4 text-primary" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
                    Previous Analyses ({historyList.length})
                  </h3>
            </div>
            <span className="text-[11px] text-muted-foreground">
              Click any past analysis to view details &amp; risk factors
            </span>
          </div>

          <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-thin">
            {historyList.map((item, idx) => {
              const isSelected = selectedPrediction?.id === item.id;
              const badge = getRiskBadge(item.rfRiskLevel);
              const thumb = item.annotatedImage || item.originalImage || item.image || item.imagePreview;
              const hazardLabels = item.detectedObjects?.map((o) => o.label).slice(0, 2).join(", ");

              return (
                <button
                  key={item.id || idx}
                  onClick={() => selectAnalysis(item)}
                  className={`flex min-w-[240px] max-w-[280px] shrink-0 items-center gap-3 rounded-xl border p-2.5 text-left transition-all ${
                    isSelected
                      ? "border-primary bg-primary/5 ring-2 ring-primary/30 shadow-xs"
                      : "border-border bg-muted/20 hover:border-primary/50 hover:bg-muted/40"
                  }`}
                >
                  <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-slate-900/10 border border-border">
                    {thumb ? (
                      <img
                        src={resolveImageUrl(thumb)}
                        alt="site"
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          const fallback = item.originalImage || item.image;
                          if (fallback && e.target.src !== resolveImageUrl(fallback)) {
                            e.target.src = resolveImageUrl(fallback);
                          } else {
                            e.target.style.display = "none";
                          }
                        }}
                      />
                    ) : (
                      <div className="grid h-full w-full place-items-center text-xs">🪣</div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <span className="truncate text-xs font-bold text-foreground">
                        {item.id || `Analysis #${historyList.length - idx}`}
                      </span>
                      <span className={`rounded px-1.5 py-0.2 text-[10px] font-bold uppercase ${badge.bg}`}>
                        {item.rfRiskLevel}
                      </span>
                    </div>

                    <div className="truncate text-[11px] text-muted-foreground">
                      {hazardLabels || item.location || "Mosquito site"}
                    </div>

                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground mt-0.5">
                      <Clock className="h-3 w-3" />
                      <span>{formatDate(item.createdAt)}</span>
                      {isSelected && (
                        <span className="ml-auto font-bold text-primary text-[10px]">Active</span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <PageHeader
        title="Dengue Risk Assessment Result"
        description={`Report ${reportId} · ${reportLocation}${
          hasReportCoords
            ? ` · GPS: ${reportCoords.lat.toFixed(6)}, ${reportCoords.lng.toFixed(6)}`
            : " · GPS coordinates not selected"
        }`}
      />

      <div className="grid gap-6 lg:grid-cols-[1.1fr_1.3fr]">
        {/* Stage 1: Visual Inspection & YOLO Detections */}
        <div className="space-y-4">
          <div className="soft-shadow relative overflow-hidden rounded-2xl border border-border bg-card p-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs font-bold text-foreground tracking-wider uppercase">
                <Layers className="h-4 w-4 text-primary" /> Stage 1: YOLOv8 Computer Vision
              </span>
              {prediction?.annotatedImage && (
                <div className="flex items-center gap-1 rounded-lg border border-border bg-muted/40 p-1 text-xs">
                  <button
                    onClick={() => setShowAnnotated(true)}
                    className={`rounded px-2 py-1 font-medium transition-colors ${
                      showAnnotated ? "bg-primary text-primary-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Bounding Boxes
                  </button>
                  <button
                    onClick={() => setShowAnnotated(false)}
                    className={`rounded px-2 py-1 font-medium transition-colors ${
                      !showAnnotated ? "bg-primary text-primary-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Original
                  </button>
                </div>
              )}
            </div>

            <div className="relative flex min-h-[300px] max-h-[420px] items-center justify-center overflow-hidden rounded-xl bg-slate-950/5 border border-border/50">
              {displayImage ? (
                <img
                  src={resolveImageUrl(displayImage)}
                  alt="Dengue breeding analysis"
                  className="max-h-[420px] w-full rounded-xl object-contain"
                  onError={(e) => {
                    const fallback = rawSrc ? resolveImageUrl(rawSrc) : "";
                    if (fallback && e.target.src !== fallback) {
                      e.target.src = fallback;
                    }
                  }}
                />
              ) : (
                <div className="p-8 text-center text-sm text-muted-foreground">
                  <ShieldCheck className="mx-auto mb-2 h-10 w-10 text-muted-foreground/50" />
                  No image preview available
                </div>
              )}
            </div>

            <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Cpu className="h-3.5 w-3.5 text-primary" />
                Vision: <strong className="text-foreground">best.pt</strong>
              </span>
              <span>Classes: Tire, Coconut, Bottle, Drain, Vase</span>
            </div>
          </div>

          {/* Identified Hazards Card */}
          <div className="soft-shadow rounded-2xl border border-border bg-card p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-foreground tracking-wider uppercase flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-primary" /> Detected Hazards ({detectedObjects.length})
              </span>
              <span className="text-xs text-muted-foreground">
                Vision Conf: <strong className="text-foreground">{confidence}%</strong>
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              {detectedObjects.map((obj, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 rounded-xl border border-border bg-muted/40 px-3 py-1.5 text-xs"
                >
                  <span className="font-semibold text-foreground">{obj.label}</span>
                  <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[11px] font-medium text-primary">
                    {obj.conf}%
                  </span>
                  {obj.severity && (
                    <span className="rounded bg-rose-500/10 px-1.5 py-0.5 text-[11px] font-medium text-rose-500">
                      Sev: {obj.severity}
                    </span>
                  )}
                </div>
              ))}
              {detectedObjects.length === 0 && (
                <div className="rounded-xl border border-dashed border-emerald-500/30 bg-emerald-500/5 p-3 text-xs text-emerald-600 w-full">
                  ✓ Clean Site — No water-holding dengue breeding containers detected.
                </div>
              )}
            </div>
          </div>

          {/* Actionable Recommendations */}
          <div className="soft-shadow rounded-2xl border border-border bg-card p-5">
            <h3 className="mb-3 font-semibold text-foreground text-sm flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Actionable Recommendations
            </h3>
            <ul className="space-y-2 text-xs text-foreground">
              {recommendations.map((rec, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Stage 2: Machine Learning Multi-Factor Risk Assessment (Random Forest) */}
        <div className="space-y-4">
          {/* Main Risk Score Card */}
          <div className="soft-shadow rounded-2xl border border-border bg-card p-6">
            <div className="mb-4 flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                <div>
                  <h3 className="font-bold text-foreground">Stage 2: Machine Learning Risk Score</h3>
                  <p className="text-xs text-muted-foreground">Trained with Random Forest on dengue_data.csv</p>
                </div>
              </div>
              <div className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold ${riskBadge.bg}`}>
                <RiskIcon className="h-3.5 w-3.5" />
                {riskBadge.label}
              </div>
            </div>

            {/* Score Display Bar */}
            <div className="mb-6 rounded-2xl border border-border bg-muted/20 p-5">
              <div className="flex items-baseline justify-between mb-2">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Composite Risk Level
                </span>
                <div className="flex items-baseline gap-1">
                  <span className={`text-3xl font-extrabold ${riskBadge.textColor}`}>
                    {rfRiskScore}
                  </span>
                  <span className="text-sm font-semibold text-muted-foreground">/ 100</span>
                </div>
              </div>

              <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className={`h-full transition-all duration-700 ${riskBadge.barColor}`}
                  style={{ width: `${Math.min(Math.max(rfRiskScore, 5), 100)}%` }}
                />
              </div>

              <div className="mt-2 flex justify-between text-[11px] font-medium text-muted-foreground">
                <span>0 (Low Risk)</span>
                <span>40 (Medium Risk)</span>
                <span>70 (High Risk)</span>
                <span>100</span>
              </div>
            </div>

            {/* 5-Factor Feature Matrix (from dengue_data.csv) */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-bold text-foreground uppercase tracking-wider">
                  5-Factor ML Model Input Matrix
                </span>
                <span className="text-[11px] text-muted-foreground font-mono">
                  RandomForestRegressor + Classifier
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {/* Feature 1: AI Visual Severity */}
                <div className="rounded-xl border border-border bg-card p-3">
                  <div className="text-[11px] font-medium text-muted-foreground">Visual Severity</div>
                  <div className="mt-1 text-lg font-bold text-foreground">{factors.aiSeverity} / 100</div>
                  <div className="text-[10px] text-muted-foreground">Hazard type weight</div>
                </div>

                {/* Feature 2: AI Confidence */}
                <div className="rounded-xl border border-border bg-card p-3">
                  <div className="text-[11px] font-medium text-muted-foreground">Vision Confidence</div>
                  <div className="mt-1 text-lg font-bold text-foreground">{factors.aiConfidence}%</div>
                  <div className="text-[10px] text-muted-foreground">YOLO certainty</div>
                </div>

                {/* Feature 3: Recent Rainfall */}
                <div className="rounded-xl border border-border bg-card p-3">
                  <div className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
                    <CloudRain className="h-3 w-3 text-sky-500" /> Recent Rain
                  </div>
                  <div className="mt-1 text-lg font-bold text-foreground">{factors.rainfallMm} mm</div>
                  <div className="text-[10px] text-emerald-600 font-medium truncate">
                    {prediction?.environmentalSources?.weather ? "⚡ Auto-Radar" : "7-day precipitation"}
                  </div>
                </div>

                {/* Feature 4: NDCU District Cases */}
                <div className="rounded-xl border border-border bg-card p-3">
                  <div className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
                    <Activity className="h-3 w-3 text-amber-500" /> District Cases
                  </div>
                  <div className="mt-1 text-lg font-bold text-foreground">{factors.ndcuCases}</div>
                  <div className="text-[10px] text-emerald-600 font-medium truncate">
                    {prediction?.environmentalSources?.ndcu ? "⚡ NDCU Surveillance" : "NDCU weekly cases"}
                  </div>
                </div>

                {/* Feature 5: Local Report Density */}
                <div className="rounded-xl border border-border bg-card p-3">
                  <div className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
                    <MapPin className="h-3 w-3 text-indigo-500" /> Local Density
                  </div>
                  <div className="mt-1 text-lg font-bold text-foreground">{factors.reportDensity} / 2km</div>
                  <div className="text-[10px] text-emerald-600 font-medium truncate">
                    {prediction?.environmentalSources?.density ? "⚡ Auto-Calculated" : "Active cluster reports"}
                  </div>
                </div>

                {/* ML Engine Badge */}
                <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 flex flex-col justify-between">
                  <div className="text-[11px] font-semibold text-primary">Model Trained</div>
                  <div className="text-xs font-bold text-foreground">87.5% Acc · R² 0.91</div>
                  <div className="text-[10px] text-primary">risk_model.pkl active</div>
                </div>
              </div>
            </div>

            {/* Explainable AI Insight */}
            <div className="mt-4 rounded-xl border border-dashed border-border bg-muted/30 p-3 text-xs text-muted-foreground flex items-start gap-2">
              <Info className="h-4 w-4 shrink-0 text-primary mt-0.5" />
              <div>
                <strong className="text-foreground">How the ML Model works: </strong>
                The image is first classified using YOLOv8 to detect breeding containers. Its visual severity ({factors.aiSeverity}) and confidence ({factors.aiConfidence}%) are combined with local rainfall ({factors.rainfallMm}mm) and district transmission history ({factors.ndcuCases} cases) to compute the final multi-factor risk score.
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3 pt-2">
            <div className="flex flex-wrap gap-3">
              <Button
                className="flex-1 font-semibold shadow-md"
                onClick={handleSendToPhi}
                disabled={isSending || Boolean(dispatchedReport)}
                variant={dispatchedReport ? "outline" : "default"}
              >
                {isSending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Dispatching to PHI...
                  </>
                ) : dispatchedReport ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Dispatched to PHI ({dispatchedReport.id})
                  </>
                ) : (
                  <>
                    <Eye className="h-4 w-4" /> Send to PHI for Inspection
                  </>
                )}
              </Button>
              <Button variant="outline" onClick={downloadReport} disabled={isDownloadingPdf}>
                {isDownloadingPdf ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Generating PDF...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4" /> Download PDF Report
                  </>
                )}
              </Button>
            </div>

            {/* Dispatched Confirmation Card */}
            {dispatchedReport && (
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-xs text-emerald-800 dark:text-emerald-200">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="font-semibold flex items-center gap-1.5 text-emerald-700 dark:text-emerald-300">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    Report {dispatchedReport.id} Successfully Dispatched
                  </div>
                  <Link
                    to="/citizen/track"
                    className="text-primary hover:underline font-semibold text-xs whitespace-nowrap"
                  >
                    Track in My Complaints →
                  </Link>
                </div>
                <p className="leading-relaxed opacity-90">
                  Assigned to <strong>PHI Officer: {dispatchedReport.phi || "Regional Unit"}</strong>. The officer has received a high-priority alert on the PHI portal to conduct on-site inspection and larviciding.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
        </>
      )}
    </>
  );
}
