import { useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
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
} from "lucide-react";
import { toast } from "sonner";
import Button from "../../../components/common/Button";
import PageHeader from "../../../components/common/PageHeader";

export default function AIResult() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state || {};
  const prediction = state.prediction;
  const originalPreview = state.imagePreview;
  const reportLocation = state.location || "Nugegoda, Ward 12";

  const [showAnnotated, setShowAnnotated] = useState(true);

  // Fallback defaults if accessed directly
  const risk = prediction?.risk || "High";
  const confidence = prediction?.confidence ?? 87.5;
  const detectedObjects = prediction?.detectedObjects || [
    { label: "Tire", conf: 89.2 },
    { label: "Bottle", conf: 76.5 },
  ];
  const recommendations = prediction?.recommendations?.length
    ? prediction.recommendations
    : [
        "Empty water-retaining receptacles immediately to eliminate mosquito breeding larvae.",
        "Store unused tires and containers in dry, sheltered areas or recycle them.",
      ];
  const modelSource = prediction?.source || "best.pt (FastAPI)";
  const reportId = prediction?.id || "DG-1042";

  // Image source selection
  const annotatedSrc = prediction?.annotatedImage || originalPreview;
  const rawSrc = prediction?.originalImage || originalPreview;
  const displayImage = showAnnotated && annotatedSrc ? annotatedSrc : (rawSrc || originalPreview);

  const getRiskBadge = (level) => {
    switch (level?.toLowerCase()) {
      case "high":
        return {
          bg: "bg-red-500/10 text-red-600 border-red-500/30",
          icon: AlertTriangle,
          label: "High Risk Breeding Site",
        };
      case "medium":
        return {
          bg: "bg-amber-500/10 text-amber-600 border-amber-500/30",
          icon: AlertCircle,
          label: "Medium Risk Potential Site",
        };
      default:
        return {
          bg: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30",
          icon: CheckCircle2,
          label: "Low Risk / Clean Site",
        };
    }
  };

  const riskBadge = getRiskBadge(risk);
  const RiskIcon = riskBadge.icon;

  const downloadReport = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({
      reportId,
      location: reportLocation,
      risk,
      confidence: `${confidence}%`,
      detectedObjects,
      recommendations,
      timestamp: new Date().toISOString(),
    }, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `DengueGuard-Report-${reportId}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    toast.success("Analysis report downloaded");
  };

  return (
    <>
      <div className="mb-4">
        <Link
          to="/citizen/upload"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Upload
        </Link>
      </div>

      <PageHeader
        title="AI Analysis Result"
        description={`Report ${reportId} · ${reportLocation}`}
      />

      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        {/* Visual Detection Preview */}
        <div className="space-y-3">
          <div className="soft-shadow relative overflow-hidden rounded-2xl border border-border bg-card p-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                <Layers className="h-4 w-4 text-primary" /> Visual Inspection
              </span>
              {prediction?.annotatedImage && (
                <div className="flex items-center gap-1 rounded-lg border border-border bg-muted/40 p-1 text-xs">
                  <button
                    onClick={() => setShowAnnotated(true)}
                    className={`rounded px-2 py-1 font-medium transition-colors ${
                      showAnnotated ? "bg-primary text-primary-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    AI Detection Box
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

            <div className="relative flex min-h-[300px] max-h-[440px] items-center justify-center overflow-hidden rounded-xl bg-slate-900/5">
              {displayImage ? (
                <img
                  src={displayImage}
                  alt="Dengue breeding analysis"
                  className="max-h-[440px] w-full rounded-xl object-contain"
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
                Inference Model: <strong className="text-foreground">{modelSource}</strong>
              </span>
              <span>Classes: Tire, Bottle, Coconut, Drain, Vase</span>
            </div>
          </div>
        </div>

        {/* Risk Assessment & Recommendations */}
        <div className="space-y-4">
          <div className="soft-shadow rounded-2xl border border-border bg-card p-6">
            <div className="mb-4 flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-semibold text-foreground">Risk Assessment</h3>
              <div className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${riskBadge.bg}`}>
                <RiskIcon className="h-3.5 w-3.5" />
                {riskBadge.label}
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-2">
                <span className="text-sm text-muted-foreground">Primary Detection</span>
                <span className="text-sm font-semibold text-foreground">
                  {prediction?.label || "Breeding Containers Detected"}
                </span>
              </div>

              <div className="flex items-center justify-between border-b border-border pb-2">
                <span className="text-sm text-muted-foreground">AI Confidence</span>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-20 overflow-hidden rounded-full bg-muted">
                    <div
                      className={`h-full ${risk === "High" ? "bg-red-500" : risk === "Medium" ? "bg-amber-500" : "bg-emerald-500"}`}
                      style={{ width: `${Math.min(confidence, 100)}%` }}
                    />
                  </div>
                  <span className="text-sm font-bold text-foreground">{confidence}%</span>
                </div>
              </div>

              <div>
                <span className="mb-2 block text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Identified Breeding Hazards ({detectedObjects.length})
                </span>
                <div className="flex flex-wrap gap-2">
                  {detectedObjects.map((obj, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-muted/50 px-2.5 py-1 text-xs font-medium text-foreground"
                    >
                      <Sparkles className="h-3 w-3 text-primary" />
                      {obj.label}
                      <span className="text-muted-foreground">({obj.conf}%)</span>
                    </span>
                  ))}
                  {detectedObjects.length === 0 && (
                    <span className="text-xs text-muted-foreground">No hazardous objects detected</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="soft-shadow rounded-2xl border border-border bg-card p-6">
            <h3 className="mb-3 font-semibold text-foreground">Actionable Recommendations</h3>
            <ul className="space-y-2 text-sm text-foreground">
              {recommendations.map((rec, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-wrap gap-3 pt-2">
            <Button
              className="flex-1 font-semibold"
              onClick={() => toast.success("Notification and report dispatched to Ward PHI team")}
            >
              <Eye className="h-4 w-4" /> Send to PHI for Inspection
            </Button>
            <Button variant="outline" onClick={downloadReport}>
              <Download className="h-4 w-4" /> Download Report
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
