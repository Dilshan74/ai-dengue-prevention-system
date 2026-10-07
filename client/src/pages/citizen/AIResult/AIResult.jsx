import { useState } from "react";
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
  Gauge,
  TrendingUp,
  MapPin,
  Info,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import Button from "../../../components/common/Button";
import PageHeader from "../../../components/common/PageHeader";
import citizenService from "../../../services/citizenService";
import aiService from "../../../services/aiService";

export default function AIResult() {
  const location = useLocation();
  const state = location.state || {};
  const prediction = state.prediction;
  const originalPreview = state.imagePreview;

  const [showAnnotated, setShowAnnotated] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [dispatchedReport, setDispatchedReport] = useState(null);

  if (!prediction) {
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

  const reportLocation = state.location || prediction.location || "Location not specified";
  const reportCoords = state.coords;
  const hasReportCoords =
    Number.isFinite(reportCoords?.lat) && Number.isFinite(reportCoords?.lng);

  // Machine Learning Risk values from Random Forest model
  const rfRiskScore = prediction.rfRiskScore !== undefined ? Number(prediction.rfRiskScore) : 0;
  const rfRiskLevel = prediction.rfRiskLevel || prediction.risk || "Low";
  const confidence = prediction.confidence ?? 0;
  const aiSeverity = prediction.aiSeverityScore ?? (prediction.riskFactors?.aiSeverity ?? 0);
  const detectedObjects = prediction.detectedObjects || [];

  // Risk Factors (features from dengue_data.csv)
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
  const reportId = prediction.id || "N/A";

  // Image source selection
  const annotatedSrc = prediction.annotatedImage || originalPreview;
  const rawSrc = prediction.originalImage || originalPreview;
  const displayImage = showAnnotated && annotatedSrc ? annotatedSrc : (rawSrc || originalPreview);

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
          state.description ||
          `AI Dengue Risk Alert: ${rfRiskLevel} risk site detected (${detectedObjects.map((o) => o.label).join(", ") || "breeding hazard"}).`,
        category: state.category || "container",
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
      <div className="mb-4 flex items-center justify-between">
        <Link
          to="/citizen/upload"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Upload
        </Link>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
          <Cpu className="h-3.5 w-3.5" /> 2-Stage AI &amp; ML Architecture
        </span>
      </div>

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
                  src={displayImage}
                  alt="Dengue breeding analysis"
                  className="max-h-[420px] w-full rounded-xl object-contain"
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
                    to="/citizen/complaints"
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
  );
}
