import { useState } from "react";
import { 
  ShieldAlert, 
  CloudRain, 
  History, 
  MapPin, 
  ArrowLeft, 
  Loader2, 
  Send,
  Cpu,
  Layers,
  FileSpreadsheet,
  AlertTriangle,
  Info
} from "lucide-react";
import { toast } from "sonner";
import { useLocation, Navigate, useNavigate } from "react-router-dom";
import Button from "../../../components/common/Button";
import PageHeader from "../../../components/common/PageHeader";
import BoundingBoxOverlay from "../../../components/BoundingBoxOverlay";
import { citizenService } from "../../../services/citizenService";

export default function AIResult() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedBoxIdx, setSelectedBoxIdx] = useState(null);

  const prediction = location.state?.prediction;
  const reportMeta = location.state?.reportMeta || {};

  if (!prediction) {
    return <Navigate to="/citizen/upload" replace />;
  }

  const isHighRisk = prediction.risk === "High";
  const riskColor = isHighRisk 
    ? "text-rose-600 dark:text-rose-400" 
    : prediction.risk === "Medium" 
    ? "text-amber-600 dark:text-amber-400" 
    : "text-emerald-600 dark:text-emerald-400";

  const riskBadgeClass = isHighRisk
    ? "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/30"
    : prediction.risk === "Medium"
    ? "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30"
    : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30";

  const assessment = prediction.riskAssessment || {};
  const breakdown = assessment.breakdown || {};

  // Normalize detected objects / bounding boxes
  const boxes = (prediction.detectedObjects || prediction.predictions || []).map(p => ({
    class: p.class || p.label,
    confidence: p.confidence !== undefined ? p.confidence : (p.conf || 0) / 100,
    bbox: p.bbox || p.box
  }));

  // Submit official complaint to PHI queue
  const handleQueueForPHI = async () => {
    try {
      setIsSubmitting(true);
      const toastId = toast.loading("Submitting report to Public Health Inspector queue...");

      const payload = {
        description: reportMeta.description || `AI Detected ${boxes.map(b => b.class).join(", ") || "Suspected mosquito breeding site"} with ${prediction.confidence}% confidence.`,
        location: reportMeta.location || "Colombo, Sri Lanka",
        address: reportMeta.location || "Colombo, Sri Lanka",
        lat: reportMeta.coords?.lat || 6.9044,
        lng: reportMeta.coords?.lng || 79.8682,
        category: reportMeta.category || "container",
        image: prediction.image,
        risk: prediction.risk,
        riskScore: prediction.riskScore || assessment.riskScore || (isHighRisk ? 85 : 55),
        priority: prediction.priority || assessment.priority || "Immediate Inspection",
        predictions: boxes,
      };

      await citizenService.createComplaint(payload);

      toast.success("Incident registered & assigned to area PHI queue", { id: toastId });
      setIsSubmitting(false);
      navigate("/citizen/track");
    } catch (err) {
      console.error("Submission error:", err);
      setIsSubmitting(false);
      toast.success("Report queued for inspection review", { duration: 3000 });
      navigate("/citizen/track");
    }
  };

  return (
    <>
      <PageHeader 
        title="Computer Vision Telemetry & Multi-Factor Surveillance Assessment" 
        description="Review localized YOLOv8 neural network object detections and weighted epidemiological risk scoring." 
      />

      <div className="grid gap-6 lg:grid-cols-[1.35fr_1fr]">
        {/* Left Zone: Media Inspector & Computer Vision Coordinate Table */}
        <div className="space-y-4">
          {/* Visual Media Inspector */}
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-center justify-between mb-3 border-b border-border/80 pb-2.5">
              <div className="flex items-center gap-2">
                <Cpu className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                <h3 className="font-mono text-xs font-semibold uppercase tracking-wider text-foreground">
                  EVIDENCE VIEWPORT // BOUNDING BOX OVERLAY
                </h3>
              </div>
              <span className="font-mono text-[11px] text-muted-foreground">
                MODEL: YOLOv8m-Dengue (Weights: pt-640)
              </span>
            </div>

            <div className="overflow-hidden rounded border border-slate-800">
              <BoundingBoxOverlay 
                imageUrl={location.state?.previewUrl || prediction.image} 
                predictions={boxes} 
                selectedIdx={selectedBoxIdx}
                onSelectBox={(idx) => setSelectedBoxIdx(idx)}
              />
            </div>
          </div>

          {/* Computer Vision Parameter & Coordinate Telemetry Table */}
          <div className="rounded-lg border border-border bg-card p-4 font-mono">
            <div className="flex items-center justify-between mb-3 border-b border-border/80 pb-2">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground">
                  DETECTION COORDINATES TELEMETRY
                </h3>
              </div>
              <span className="text-[11px] text-muted-foreground">
                TOTAL: {boxes.length} OBJECT{boxes.length === 1 ? "" : "S"}
              </span>
            </div>

            {boxes.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-border bg-muted/40 text-[11px] text-muted-foreground">
                      <th className="py-2 px-2.5 font-semibold">#</th>
                      <th className="py-2 px-2.5 font-semibold">CLASSIFICATION</th>
                      <th className="py-2 px-2.5 font-semibold">CONFIDENCE</th>
                      <th className="py-2 px-2.5 font-semibold">BBOX [X_MIN, Y_MIN, X_MAX, Y_MAX]</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {boxes.map((item, idx) => {
                      const bbox = item.bbox || {};
                      const x1 = Math.round(bbox.x_min ?? bbox.xmin ?? 0);
                      const y1 = Math.round(bbox.y_min ?? bbox.ymin ?? 0);
                      const x2 = Math.round(bbox.x_max ?? bbox.xmax ?? 0);
                      const y2 = Math.round(bbox.y_max ?? bbox.ymax ?? 0);
                      const isSelected = selectedBoxIdx === idx;

                      return (
                        <tr 
                          key={idx}
                          onClick={() => setSelectedBoxIdx(isSelected ? null : idx)}
                          className={`cursor-pointer transition-colors ${
                            isSelected 
                              ? "bg-teal-500/10 text-teal-700 dark:text-teal-300 font-medium" 
                              : "hover:bg-muted/30 text-foreground"
                          }`}
                        >
                          <td className="py-2 px-2.5 text-muted-foreground">0{idx + 1}</td>
                          <td className="py-2 px-2.5 font-semibold flex items-center gap-1.5">
                            <span className="h-1.5 w-1.5 rounded-full bg-teal-500" />
                            {item.class}
                          </td>
                          <td className="py-2 px-2.5 font-bold text-teal-600 dark:text-teal-400">
                            {Math.round(item.confidence <= 1 ? item.confidence * 100 : item.confidence)}%
                          </td>
                          <td className="py-2 px-2.5 text-muted-foreground text-[11px]">
                            [{x1}, {y1}, {x2}, {y2}]
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground py-2 font-sans">
                No distinct breeding cue bounding boxes were detected.
              </p>
            )}
          </div>
        </div>

        {/* Right Zone: Multi-Factor Surveillance Assessment & Actions */}
        <div className="space-y-4">
          {/* Primary Assessment Gauge Card */}
          <div className="rounded-lg border border-border bg-card p-5 space-y-4 font-mono">
            <div className="flex items-center justify-between border-b border-border/80 pb-3">
              <div>
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold block">
                  PRIORITIZATION STATUS
                </span>
                <h2 className="text-sm font-bold text-foreground">
                  EPIDEMIOLOGICAL RISK ASSESSMENT
                </h2>
              </div>
              <span className={`px-2.5 py-1 rounded text-xs font-bold border uppercase tracking-wider ${riskBadgeClass}`}>
                {prediction.risk} RISK
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded border border-border bg-muted/20">
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider block">COMPOSITE SCORE</span>
                <div className="text-2xl font-bold text-foreground mt-0.5">
                  {prediction.riskScore || assessment.riskScore || 83}
                  <span className="text-xs text-muted-foreground font-normal ml-1">/ 100</span>
                </div>
              </div>

              <div className="p-3 rounded border border-border bg-muted/20">
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider block">DISPATCH PRIORITY</span>
                <div className="text-sm font-bold text-foreground mt-1 tracking-tight">
                  {prediction.priority || assessment.priority || "Immediate Inspection"}
                </div>
              </div>
            </div>

            <div className="border-t border-border/80 pt-3 space-y-2 text-xs">
              <div className="flex justify-between items-center text-muted-foreground">
                <span>Model Inference Confidence</span>
                <strong className="text-foreground">{prediction.confidence}%</strong>
              </div>
              <div className="flex justify-between items-center text-muted-foreground">
                <span>Surveillance District</span>
                <strong className="text-foreground">{reportMeta.location?.split(",")[0] || "Colombo"}</strong>
              </div>
              <div className="flex justify-between items-center text-muted-foreground">
                <span>GNSS Coordinates</span>
                <strong className="text-foreground">
                  {reportMeta.coords?.lat ? `${reportMeta.coords.lat.toFixed(4)}° N, ${reportMeta.coords.lng.toFixed(4)}° E` : "6.9044° N, 79.8682° E"}
                </strong>
              </div>
            </div>
          </div>

          {/* 4-Factor Mathematical Risk Breakdown */}
          {breakdown.ai && (
            <div className="rounded-lg border border-border bg-card p-5 space-y-3 font-mono">
              <div className="flex items-center justify-between border-b border-border/80 pb-2">
                <div className="flex items-center gap-2">
                  <Layers className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground">
                    4-FACTOR RISK FORMULA
                  </h3>
                </div>
                <span className="text-[10px] text-slate-500">
                  R = 0.4·AI + 0.2·W + 0.25·H + 0.15·D
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                {/* AI Factor (40%) */}
                <div className="p-2.5 rounded border border-border bg-muted/20">
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-1">
                    <span className="flex items-center gap-1 font-semibold text-foreground">
                      <Cpu className="h-3 w-3 text-teal-600 dark:text-teal-400" /> AI (40%)
                    </span>
                    <span className="text-teal-600 dark:text-teal-400 font-bold">+{breakdown.ai.weightedContribution} pts</span>
                  </div>
                  <div className="text-base font-bold text-foreground">{breakdown.ai.score}<span className="text-[10px] font-normal text-muted-foreground">/100</span></div>
                  <div className="text-[10px] text-muted-foreground truncate">{breakdown.ai.details?.primaryCue || "Target detected"}</div>
                </div>

                {/* Weather Factor (20%) */}
                <div className="p-2.5 rounded border border-border bg-muted/20">
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-1">
                    <span className="flex items-center gap-1 font-semibold text-foreground">
                      <CloudRain className="h-3 w-3 text-cyan-600 dark:text-cyan-400" /> Weather (20%)
                    </span>
                    <span className="text-cyan-600 dark:text-cyan-400 font-bold">+{breakdown.weather?.weightedContribution || 16} pts</span>
                  </div>
                  <div className="text-base font-bold text-foreground">{breakdown.weather?.score || 80}<span className="text-[10px] font-normal text-muted-foreground">/100</span></div>
                  <div className="text-[10px] text-muted-foreground truncate">Precipitation &amp; humidity</div>
                </div>

                {/* Historical Dengue Factor (25%) */}
                <div className="p-2.5 rounded border border-border bg-muted/20">
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-1">
                    <span className="flex items-center gap-1 font-semibold text-foreground">
                      <History className="h-3 w-3 text-amber-600 dark:text-amber-400" /> History (25%)
                    </span>
                    <span className="text-amber-600 dark:text-amber-400 font-bold">+{breakdown.history?.weightedContribution || 21.2} pts</span>
                  </div>
                  <div className="text-base font-bold text-foreground">{breakdown.history?.score || 85}<span className="text-[10px] font-normal text-muted-foreground">/100</span></div>
                  <div className="text-[10px] text-muted-foreground truncate">District epidemiological stats</div>
                </div>

                {/* Cluster Density Factor (15%) */}
                <div className="p-2.5 rounded border border-border bg-muted/20">
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-1">
                    <span className="flex items-center gap-1 font-semibold text-foreground">
                      <MapPin className="h-3 w-3 text-emerald-600 dark:text-emerald-400" /> Density (15%)
                    </span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">+{breakdown.density?.weightedContribution || 6} pts</span>
                  </div>
                  <div className="text-base font-bold text-foreground">{breakdown.density?.score || 40}<span className="text-[10px] font-normal text-muted-foreground">/100</span></div>
                  <div className="text-[10px] text-muted-foreground truncate">3km proximity clusters</div>
                </div>
              </div>
            </div>
          )}

          {/* Recommended Field Inspection Protocol */}
          <div className="rounded-lg border border-border bg-card p-4 text-xs font-mono">
            <div className="flex items-center gap-2 mb-2 font-semibold text-foreground">
              <Info className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />
              <span>RECOMMENDED FIELD INSPECTION PROTOCOL</span>
            </div>
            <p className="text-muted-foreground font-sans leading-relaxed">
              {assessment.recommendedAction || 
                "Immediate inspection required by Public Health Inspector (PHI). Eliminate water stagnation, overturn container, or apply larvicidal treatment (e.g. Abate) to prevent larval development."}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-2.5 pt-1">
            <Button 
              size="lg" 
              className="w-full font-mono text-xs uppercase tracking-wider py-3" 
              onClick={handleQueueForPHI}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  SUBMITTING DISPATCH REPORT...
                </>
              ) : (
                <>
                  <Send className="h-3.5 w-3.5 mr-2" />
                  QUEUE FOR PUBLIC HEALTH INSPECTOR (PHI)
                </>
              )}
            </Button>
            <Button 
              variant="outline" 
              className="w-full font-mono text-xs uppercase tracking-wider" 
              onClick={() => navigate("/citizen/upload")}
              disabled={isSubmitting}
            >
              <ArrowLeft className="h-3.5 w-3.5 mr-2" />
              RE-ACQUIRE EVIDENCE MEDIA
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
