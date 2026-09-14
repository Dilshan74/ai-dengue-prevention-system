import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  MapPin, 
  ArrowRight, 
  CheckCircle2, 
  Crosshair, 
  Loader2, 
  Scan,
  Layers,
  FileText
} from "lucide-react";
import { toast } from "sonner";
import Button from "../../../components/common/Button";
import PageHeader from "../../../components/common/PageHeader";
import { FormField, Input, Select, Textarea } from "../../../components/common/Field";
import ImageUploader from "../../../components/ai/ImageUploader";
import { aiService } from "../../../services/aiService";
import { mapService } from "../../../services/mapService";

const CATEGORIES = [
  { value: "container", label: "Discarded Container / Tyres" },
  { value: "water", label: "Stagnant Water Pool" },
  { value: "drain", label: "Blocked Drain / Gutter" },
  { value: "organic", label: "Organic / Coconut Husk" },
  { value: "other", label: "Other Breeding Risk" },
];

export default function UploadImage() {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [predictions, setPredictions] = useState([]);
  const [analysisResult, setAnalysisResult] = useState(null);

  // Form State
  const [locationName, setLocationName] = useState("Colombo 07, Western Province");
  const [coords, setCoords] = useState({ lat: 6.9044, lng: 79.8682 });
  const [gpsStatus, setGpsStatus] = useState("idle"); // 'idle' | 'locating' | 'success' | 'error'
  const [gpsAccuracy, setGpsAccuracy] = useState(null);
  const [category, setCategory] = useState("container");
  const [description, setDescription] = useState("");
  const [previewUrl, setPreviewUrl] = useState(null);

  // Function to detect user's live GPS location
  const handleDetectLocation = async () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }

    setGpsStatus("locating");
    const toastId = toast.loading("Acquiring high-accuracy GNSS/GPS satellite fix...");

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const latitude = pos.coords.latitude;
        const longitude = pos.coords.longitude;
        const accuracy = Math.round(pos.coords.accuracy);

        setCoords({ lat: latitude, lng: longitude });
        setGpsAccuracy(accuracy);

        try {
          const res = await mapService.reverseGeocode(latitude, longitude);
          const resolvedAddress = res.address || res.formatted || `Lat: ${latitude.toFixed(4)}, Lng: ${longitude.toFixed(4)}`;
          setLocationName(resolvedAddress);
          setGpsStatus("success");
          toast.success(`GNSS Position Locked: ${resolvedAddress}`, { id: toastId });
        } catch (err) {
          console.warn("Reverse geocode error:", err);
          setLocationName(`GPS: ${latitude.toFixed(4)}° N, ${longitude.toFixed(4)}° E`);
          setGpsStatus("success");
          toast.success(`Coordinates captured (Accuracy: ±${accuracy}m)`, { id: toastId });
        }
      },
      (error) => {
        console.error("GPS error:", error);
        setGpsStatus("error");
        let msg = "Unable to retrieve satellite fix";
        if (error.code === 1) msg = "Location permission denied. Please enable in browser.";
        else if (error.code === 2) msg = "GNSS position unavailable on this device.";
        else if (error.code === 3) msg = "Location request timed out.";
        toast.error(msg, { id: toastId });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  // Attempt auto-detect on component mount
  useEffect(() => {
    if (navigator.geolocation) {
      handleDetectLocation();
    }
  }, []);

  const handleSelectFile = (selectedFile, url) => {
    setFile(selectedFile);
    setPreviewUrl(url);
    setPredictions([]);
    setAnalysisResult(null);
  };

  const handleAnalyze = async () => {
    if (!file) {
      toast.error("Please provide evidence media before executing inference");
      return;
    }
    try {
      setIsScanning(true);
      const toastId = toast.loading("Executing YOLOv8 neural network & multi-factor risk inference...");
      
      const predictionData = await aiService.predict(file, {
        lat: coords.lat,
        lng: coords.lng,
        location: locationName,
        district: locationName.split(",")[0]?.trim() || "Colombo",
        category,
        description,
      });
      
      // Extract normalized bounding boxes
      const boxes = (predictionData.detectedObjects || predictionData.predictions || [])
        .filter(p => p.bbox || p.box)
        .map(p => ({
          class: p.class || p.label,
          confidence: p.confidence !== undefined ? p.confidence : (p.conf || 0) / 100,
          bbox: p.bbox || p.box
        }));

      setPredictions(boxes);
      setAnalysisResult(predictionData);
      setIsScanning(false);
      
      toast.success(
        boxes.length > 0 
          ? `Inference Complete: ${boxes.length} breeding target(s) locked` 
          : "Inference Complete: No high-risk breeding targets detected", 
        { id: toastId }
      );
    } catch (err) {
      console.error("Inference Error:", err);
      setIsScanning(false);
      toast.error(err.response?.data?.message || "Computer vision inference failed");
    }
  };

  const handleProceedToResult = () => {
    if (!analysisResult) return;
    navigate("/citizen/ai-result", { 
      state: { 
        prediction: analysisResult,
        previewUrl: previewUrl || analysisResult.image,
        reportMeta: {
          location: locationName,
          coords,
          category,
          description,
        }
      } 
    });
  };

  const riskBadgeStyle = 
    analysisResult?.risk === "High" 
      ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30" 
      : analysisResult?.risk === "Medium"
      ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30"
      : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30";

  return (
    <>
      <PageHeader
        title="Evidence Media Ingestion & Risk Prioritization"
        description="Ingest suspected breeding site photos for automated YOLOv8 computer vision classification and multi-factor surveillance scoring."
      />

      <div className="grid gap-6 lg:grid-cols-[1.35fr_1fr]">
        {/* Left Zone: Media Inspector */}
        <div className="rounded-lg border border-border bg-card p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3 border-b border-border/80 pb-2.5">
              <div className="flex items-center gap-2">
                <Scan className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                <h3 className="font-mono text-xs font-semibold uppercase tracking-wider text-foreground">
                  MEDIA INSPECTION VIEWPORT
                </h3>
              </div>
              {predictions.length > 0 && (
                <span className="font-mono text-xs px-2 py-0.5 rounded border border-teal-500/30 bg-teal-500/10 text-teal-700 dark:text-teal-300">
                  {predictions.length} TARGET{predictions.length > 1 ? "S" : ""} LOCKED
                </span>
              )}
            </div>

            <ImageUploader 
              onSelect={handleSelectFile} 
              predictions={predictions}
              isScanning={isScanning}
            />
          </div>

          {/* Telemetry Result Strip */}
          {analysisResult && (
            <div className="mt-4 p-4 rounded border border-border bg-muted/30 space-y-3 font-mono">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded text-xs font-bold border uppercase tracking-wider ${riskBadgeStyle}`}>
                    {analysisResult.risk} RISK PRIORITY
                  </span>
                  <span className="text-xs text-muted-foreground">
                    SCORE: <strong className="text-foreground">{analysisResult.riskScore || analysisResult.riskAssessment?.riskScore || 80}/100</strong>
                  </span>
                </div>
                <span className="text-xs text-muted-foreground">
                  CONFIDENCE: <strong className="text-teal-600 dark:text-teal-400">{analysisResult.confidence}%</strong>
                </span>
              </div>

              {predictions.length > 0 ? (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {predictions.map((p, i) => (
                    <span 
                      key={i} 
                      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded border border-border bg-background text-[11px] text-foreground font-mono"
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-teal-500" />
                      {p.class} <span className="text-muted-foreground">({Math.round((p.confidence <= 1 ? p.confidence * 100 : p.confidence))}%)</span>
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground font-sans">
                  No mosquito breeding indicators identified with high statistical confidence.
                </p>
              )}

              <Button 
                onClick={handleProceedToResult} 
                className="w-full mt-2 font-mono text-xs uppercase tracking-wider"
                size="sm"
              >
                INSPECT FULL ASSESSMENT &amp; QUEUE FOR PHI <ArrowRight className="h-3.5 w-3.5 ml-1" />
              </Button>
            </div>
          )}
        </div>

        {/* Right Zone: Incident Telemetry & Parameters */}
        <div className="space-y-4">
          <div className="rounded-lg border border-border bg-card p-5">
            <div className="flex items-center gap-2 mb-4 border-b border-border/80 pb-2.5">
              <Layers className="h-4 w-4 text-teal-600 dark:text-teal-400" />
              <h3 className="font-mono text-xs font-semibold uppercase tracking-wider text-foreground">
                SURVEILLANCE INCIDENT TELEMETRY
              </h3>
            </div>

            <div className="space-y-4">
              <FormField label="Incident Location / GN Division" htmlFor="location">
                <div className="flex gap-2">
                  <Input 
                    id="location" 
                    icon={MapPin} 
                    value={locationName} 
                    onChange={(e) => setLocationName(e.target.value)}
                    placeholder="Enter street, GN division, or coordinates"
                    className="flex-1 font-mono text-xs"
                  />
                  <Button 
                    type="button"
                    variant={gpsStatus === "success" ? "secondary" : "outline"}
                    onClick={handleDetectLocation}
                    disabled={gpsStatus === "locating"}
                    className="shrink-0 font-mono text-xs px-3"
                    title="Acquire live GNSS coordinates"
                  >
                    {gpsStatus === "locating" ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-teal-500" />
                    ) : (
                      <Crosshair className="h-3.5 w-3.5 text-teal-500" />
                    )}
                    <span className="hidden sm:inline">
                      {gpsStatus === "locating" ? "LOCKING..." : "LIVE GPS"}
                    </span>
                  </Button>
                </div>

                {/* Technical GNSS Coordinate Chip */}
                <div className="rounded border border-border/80 bg-muted/20 px-2.5 py-1.5 text-[11px] font-mono text-muted-foreground flex items-center justify-between mt-2">
                  <span>
                    LAT: {coords.lat ? coords.lat.toFixed(4) : "6.9044"}° N | LNG: {coords.lng ? coords.lng.toFixed(4) : "79.8682"}° E
                  </span>
                  {gpsStatus === "success" ? (
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" /> GNSS LOCK {gpsAccuracy ? `(±${gpsAccuracy}m)` : ""}
                    </span>
                  ) : gpsStatus === "locating" ? (
                    <span className="text-teal-500 font-medium flex items-center gap-1">
                      <Loader2 className="h-3 w-3 animate-spin" /> ACQUIRING...
                    </span>
                  ) : (
                    <button 
                      type="button"
                      onClick={handleDetectLocation} 
                      className="text-teal-600 dark:text-teal-400 hover:underline font-medium flex items-center gap-1 cursor-pointer"
                    >
                      <Crosshair className="h-3 w-3" /> Re-sync Fix
                    </button>
                  )}
                </div>
              </FormField>

              <FormField label="Breeding Site Target Classification" htmlFor="category">
                <Select 
                  id="category" 
                  value={category} 
                  onChange={(e) => setCategory(e.target.value)}
                  options={CATEGORIES} 
                  className="font-mono text-xs"
                />
              </FormField>

              <FormField label="Field Observation Notes" htmlFor="description">
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Record observed stagnant water characteristics, shading, container depth, or proximate human habitation..."
                  className="min-h-[90px] resize-none text-xs"
                />
              </FormField>
            </div>
          </div>

          {/* Primary Action Button */}
          <Button 
            size="lg" 
            className="w-full font-mono text-xs uppercase tracking-wider py-3" 
            onClick={handleAnalyze}
            disabled={!file || isScanning}
          >
            {isScanning ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                EXECUTING YOLOv8 INFERENCE...
              </>
            ) : (
              <>
                <Scan className="h-4 w-4 mr-2" />
                EXECUTE COMPUTER VISION INFERENCE
              </>
            )}
          </Button>
        </div>
      </div>
    </>
  );
}
