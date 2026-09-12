import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  MapPin, 
  Sparkles, 
  ArrowRight, 
  CheckCircle2, 
  Crosshair, 
  Loader2, 
  AlertCircle 
} from "lucide-react";
import { toast } from "sonner";
import Button from "../../../components/common/Button";
import PageHeader from "../../../components/common/PageHeader";
import { FormField, Input, Select, Textarea } from "../../../components/common/Field";
import ImageUploader from "../../../components/ai/ImageUploader";
import { aiService } from "../../../services/aiService";
import { mapService } from "../../../services/mapService";

const CATEGORIES = [
  { value: "water", label: "Stagnant Water" },
  { value: "container", label: "Discarded Container" },
  { value: "drain", label: "Blocked Drain" },
  { value: "other", label: "Other" },
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

  // Function to detect user's live GPS location
  const handleDetectLocation = async () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }

    setGpsStatus("locating");
    const toastId = toast.loading("Acquiring live GPS satellite position...");

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const latitude = pos.coords.latitude;
        const longitude = pos.coords.longitude;
        const accuracy = Math.round(pos.coords.accuracy);

        setCoords({ lat: latitude, lng: longitude });
        setGpsAccuracy(accuracy);

        try {
          // Reverse-geocode to human-readable address
          const res = await mapService.reverseGeocode(latitude, longitude);
          const resolvedAddress = res.address || res.formatted || `Lat: ${latitude.toFixed(4)}, Lng: ${longitude.toFixed(4)}`;
          setLocationName(resolvedAddress);
          setGpsStatus("success");
          toast.success(`Location identified: ${resolvedAddress}`, { id: toastId });
        } catch (err) {
          console.warn("Reverse geocode error:", err);
          setLocationName(`GPS: ${latitude.toFixed(4)}° N, ${longitude.toFixed(4)}° E`);
          setGpsStatus("success");
          toast.success(`GPS coordinates captured (Accuracy: ±${accuracy}m)`, { id: toastId });
        }
      },
      (error) => {
        console.error("GPS error:", error);
        setGpsStatus("error");
        let msg = "Unable to retrieve your location";
        if (error.code === 1) msg = "Location permission was denied. Please allow access in browser settings.";
        else if (error.code === 2) msg = "GPS position unavailable. Please check device location services.";
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

  const handleSelectFile = (selectedFile) => {
    setFile(selectedFile);
    setPredictions([]);
    setAnalysisResult(null);
  };

  const handleAnalyze = async () => {
    if (!file) {
      toast.error("Please add a photo of the suspected site first");
      return;
    }
    try {
      setIsScanning(true);
      const toastId = toast.loading("Running YOLOv8 neural network & multi-factor risk engine...");
      
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
          ? `Detected ${boxes.length} potential breeding site cue(s)!` 
          : "AI Analysis complete — No high-risk objects detected", 
        { id: toastId }
      );
    } catch (err) {
      console.error(err);
      setIsScanning(false);
      toast.error(err.response?.data?.message || "Failed to analyze image");
    }
  };

  const handleProceedToResult = () => {
    if (!analysisResult) return;
    navigate("/citizen/ai-result", { 
      state: { 
        prediction: analysisResult,
        reportMeta: {
          location: locationName,
          coords,
          category,
          description,
        }
      } 
    });
  };

  const riskBadgeColor = 
    analysisResult?.risk === "High" 
      ? "bg-red-500/10 text-red-500 border-red-500/30" 
      : analysisResult?.risk === "Medium"
      ? "bg-amber-500/10 text-amber-500 border-amber-500/30"
      : "bg-emerald-500/10 text-emerald-500 border-emerald-500/30";

  return (
    <>
      <PageHeader
        title="Report Suspected Breeding Site"
        description="Upload a photo for instant AI object detection and multi-factor dengue risk prioritization."
      />

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        {/* Left: Image Uploader & Live Preview */}
        <div className="soft-shadow rounded-2xl border border-border bg-card p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" /> Visual AI Detection Preview
              </h3>
              {predictions.length > 0 && (
                <span className="text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary font-medium border border-primary/20">
                  {predictions.length} Object{predictions.length > 1 ? "s" : ""} Highlighted
                </span>
              )}
            </div>

            <ImageUploader 
              onSelect={handleSelectFile} 
              predictions={predictions}
              isScanning={isScanning}
            />
          </div>

          {analysisResult && (
            <div className="mt-4 p-4 rounded-xl border border-border bg-muted/40 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${riskBadgeColor}`}>
                    {analysisResult.risk} Risk Priority
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Score: {analysisResult.riskScore || analysisResult.riskAssessment?.riskScore || 80}/100
                  </span>
                </div>
                <span className="text-xs font-medium text-foreground">
                  AI Conf: {analysisResult.confidence}%
                </span>
              </div>

              {predictions.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {predictions.map((p, i) => (
                    <span 
                      key={i} 
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-background border border-border text-xs text-foreground font-medium"
                    >
                      <span className="h-2 w-2 rounded-full bg-primary" />
                      {p.class} ({Math.round((p.confidence <= 1 ? p.confidence * 100 : p.confidence))}%)
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">
                  No container or stagnant water objects detected with high confidence.
                </p>
              )}

              <Button 
                onClick={handleProceedToResult} 
                className="w-full mt-2 font-semibold"
                size="sm"
              >
                View Full Assessment &amp; Submit <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        {/* Right: Location & Form Details */}
        <div className="space-y-4">
          <div className="soft-shadow rounded-2xl border border-border bg-card p-6">
            <h3 className="mb-4 font-semibold">Location &amp; Details</h3>
            <div className="space-y-4">
              <FormField label="Incident Location" htmlFor="location">
                <div className="flex gap-2">
                  <Input 
                    id="location" 
                    icon={MapPin} 
                    value={locationName} 
                    onChange={(e) => setLocationName(e.target.value)}
                    placeholder="Enter street, GN division or city"
                    className="flex-1"
                  />
                  <Button 
                    type="button"
                    variant={gpsStatus === "success" ? "secondary" : "outline"}
                    onClick={handleDetectLocation}
                    disabled={gpsStatus === "locating"}
                    className="shrink-0 font-medium text-xs px-3"
                    title="Click to automatically fetch live GPS coordinates"
                  >
                    {gpsStatus === "locating" ? (
                      <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    ) : (
                      <Crosshair className="h-4 w-4 text-primary" />
                    )}
                    <span className="hidden sm:inline">
                      {gpsStatus === "locating" ? "Locating..." : "Live GPS"}
                    </span>
                  </Button>
                </div>

                {/* GPS Status & Coordinates Badge */}
                <div className="rounded-xl border border-dashed border-border bg-muted/30 p-3 text-xs text-muted-foreground flex items-center justify-between">
                  <span>
                    📍 GPS: {coords.lat ? coords.lat.toFixed(4) : "6.9044"}° N, {coords.lng ? coords.lng.toFixed(4) : "79.8682"}° E
                  </span>
                  {gpsStatus === "success" ? (
                    <span className="text-emerald-500 font-medium flex items-center gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Live Satellite Fix {gpsAccuracy ? `(±${gpsAccuracy}m)` : ""}
                    </span>
                  ) : gpsStatus === "locating" ? (
                    <span className="text-primary font-medium flex items-center gap-1">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" /> Detecting Position...
                    </span>
                  ) : (
                    <button 
                      type="button"
                      onClick={handleDetectLocation} 
                      className="text-primary hover:underline font-medium flex items-center gap-1 cursor-pointer"
                    >
                      <Crosshair className="h-3 w-3" /> Auto-Detect
                    </button>
                  )}
                </div>
              </FormField>

              <FormField label="Category" htmlFor="category">
                <Select 
                  id="category" 
                  value={category} 
                  onChange={(e) => setCategory(e.target.value)}
                  options={CATEGORIES} 
                />
              </FormField>

              <FormField label="Description" htmlFor="description">
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe what you observed (e.g. Discarded tyres collecting rainwater behind the warehouse)..."
                  className="min-h-[100px] resize-none"
                />
              </FormField>
            </div>
          </div>

          <Button 
            size="lg" 
            className="w-full font-semibold shadow-md" 
            onClick={handleAnalyze}
            disabled={!file || isScanning}
          >
            <Sparkles className="h-4 w-4" /> 
            {isScanning ? "Analyzing with YOLOv8..." : "Scan & Detect Breeding Sites"}
          </Button>
        </div>
      </div>
    </>
  );
}
