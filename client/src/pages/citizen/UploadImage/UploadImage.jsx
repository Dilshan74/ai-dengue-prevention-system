import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MapPin, Sparkles, Loader2, CloudRain, Activity, Layers, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";
import Button from "../../../components/common/Button";
import PageHeader from "../../../components/common/PageHeader";
import { FormField, Input, Select, Textarea } from "../../../components/common/Field";
import ImageUploader from "../../../components/ai/ImageUploader";
import { aiService } from "../../../services/aiService";

const CATEGORIES = [
  { value: "water", label: "Stagnant Water" },
  { value: "container", label: "Discarded Container (Tire, Coconut, Bottle)" },
  { value: "drain", label: "Blocked Drain / Gutter" },
  { value: "other", label: "Other Water Holding Site" },
];

const DISTRICT_PRESETS = {
  "Nugegoda, Ward 12 (Colombo)": { rainfall: 125, cases: 980, density: 8, district: "Colombo" },
  "Colombo 05 (Havelock)": { rainfall: 120, cases: 1050, density: 9, district: "Colombo" },
  "Kelaniya, Ward 4 (Gampaha)": { rainfall: 110, cases: 750, density: 6, district: "Gampaha" },
  "Panadura, Ward 2 (Kalutara)": { rainfall: 135, cases: 480, density: 5, district: "Kalutara" },
  "Peradeniya (Kandy)": { rainfall: 85, cases: 420, density: 4, district: "Kandy" },
  "Karapitiya (Galle)": { rainfall: 90, cases: 310, density: 3, district: "Galle" },
};

export default function UploadImage() {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [location, setLocation] = useState("Nugegoda, Ward 12 (Colombo)");
  const [category, setCategory] = useState("container");
  const [description, setDescription] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Geolocation coordinates (defaults to Western Province / Nugegoda)
  const [coords, setCoords] = useState({ lat: 6.8712, lon: 79.8890, gpsActive: false });

  // Optional manual simulation mode (for testing / developers)
  const [simulationMode, setSimulationMode] = useState(false);
  const [rainfallMm, setRainfallMm] = useState(125);
  const [ndcuCases, setNdcuCases] = useState(980);
  const [reportDensity, setReportDensity] = useState(8);

  // Attempt to auto-detect browser GPS on mount
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setCoords({
            lat: Number(pos.coords.latitude.toFixed(4)),
            lon: Number(pos.coords.longitude.toFixed(4)),
            gpsActive: true,
          });
        },
        () => {
          // Fallback gracefully to default coordinates
        },
        { timeout: 5000 }
      );
    }
  }, []);

  // Update environmental defaults when location preset changes
  useEffect(() => {
    if (DISTRICT_PRESETS[location]) {
      const p = DISTRICT_PRESETS[location];
      setRainfallMm(p.rainfall);
      setNdcuCases(p.cases);
      setReportDensity(p.density);
    }
  }, [location]);

  const submit = async () => {
    if (!file) {
      toast.error("Add a photo of the site before submitting");
      return;
    }

    try {
      setIsAnalyzing(true);
      toast.info("Analyzing with YOLOv8 Vision & Random Forest ML...");

      const payload = {
        location,
        category,
        description,
        latitude: coords.lat,
        longitude: coords.lon,
      };

      // Only attach manual overrides if the user explicitly enabled simulation mode
      if (simulationMode) {
        payload.rainfall_mm = rainfallMm;
        payload.ndcu_cases = ndcuCases;
        payload.report_density = reportDensity;
      }

      const prediction = await aiService.predict(file, payload);

      toast.success("AI & ML Risk Analysis completed!");
      navigate("/citizen/ai-result", {
        state: {
          prediction,
          imagePreview: URL.createObjectURL(file),
          location,
          category,
          description,
        },
      });
    } catch (err) {
      console.error("AI analysis failed:", err);
      toast.error(err.response?.data?.message || err.message || "Failed to analyze image with AI");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Upload a report"
        description="Snap or upload a photo of suspected dengue breeding sites for automated YOLO detection & Random Forest risk assessment."
      />

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="soft-shadow rounded-2xl border border-border bg-card p-6">
          <ImageUploader onSelect={setFile} />
        </div>

        <div className="space-y-4">
          <div className="soft-shadow rounded-2xl border border-border bg-card p-6">
            <h3 className="mb-4 font-semibold text-foreground">Location &amp; Details</h3>
            <div className="space-y-4">
              <FormField label="Location / District" htmlFor="location">
                <Input
                  id="location"
                  icon={MapPin}
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Nugegoda, Ward 12 (Colombo)"
                />
                <div className="rounded-xl border border-dashed border-border bg-muted/30 p-2.5 text-xs text-muted-foreground flex items-center justify-between">
                  <span>📍 GPS: {coords.lat}° N, {coords.lon}° E</span>
                  <span className="font-medium text-primary">
                    {coords.gpsActive ? "Live GPS Connected" : "Western Province Baseline"}
                  </span>
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
                  placeholder="Describe what you observed (e.g. discarded tires holding rainwater near roadside)…"
                  className="min-h-[85px] resize-none"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </FormField>
            </div>
          </div>

          {/* Automated Environmental & Epidemiological Context Card */}
          <div className="soft-shadow rounded-2xl border border-border bg-card p-5">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-emerald-500" />
                <span className="text-sm font-semibold text-foreground">
                  Automated Contextual Intelligence
                </span>
              </div>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-600">
                100% Automated
              </span>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              Citizens don&apos;t need to know technical meteorological data. Our backend automatically retrieves live 7-day rainfall radar, district NDCU dengue case counts, and neighborhood report density.
            </p>

            <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
              <div className="rounded-xl bg-muted/40 p-2.5 border border-border/40">
                <div className="text-[10px] text-muted-foreground flex items-center justify-center gap-1">
                  <CloudRain className="h-3 w-3 text-sky-500" /> Rain Radar
                </div>
                <div className="mt-1 font-semibold text-foreground">Auto-Fetched</div>
                <div className="text-[9px] text-muted-foreground">Live 7-Day mm</div>
              </div>
              <div className="rounded-xl bg-muted/40 p-2.5 border border-border/40">
                <div className="text-[10px] text-muted-foreground flex items-center justify-center gap-1">
                  <Activity className="h-3 w-3 text-amber-500" /> Health Ministry
                </div>
                <div className="mt-1 font-semibold text-foreground">Auto-Synced</div>
                <div className="text-[9px] text-muted-foreground">NDCU Cases</div>
              </div>
              <div className="rounded-xl bg-muted/40 p-2.5 border border-border/40">
                <div className="text-[10px] text-muted-foreground flex items-center justify-center gap-1">
                  <Layers className="h-3 w-3 text-indigo-500" /> Cluster Density
                </div>
                <div className="mt-1 font-semibold text-foreground">Auto-Calculated</div>
                <div className="text-[9px] text-muted-foreground">Within 2km</div>
              </div>
            </div>

            {/* Optional Simulation Mode for Testing / PHI Officers */}
            <div className="mt-4 pt-3 border-t border-border">
              <button
                type="button"
                onClick={() => setSimulationMode(!simulationMode)}
                className="flex w-full items-center justify-between text-left text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <span className="font-medium flex items-center gap-1.5">
                  <span>🔬</span> Developer / PHI Testing Mode (Manual Override)
                </span>
                <span className="text-[11px] font-semibold text-primary flex items-center gap-1">
                  {simulationMode ? "Enabled" : "Disabled"}
                  {simulationMode ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                </span>
              </button>

              {simulationMode && (
                <div className="mt-3 space-y-3 pt-2">
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-muted-foreground">Manual Rainfall Override:</span>
                      <span className="font-semibold text-foreground">{rainfallMm} mm</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="200"
                      step="5"
                      value={rainfallMm}
                      onChange={(e) => setRainfallMm(Number(e.target.value))}
                      className="w-full accent-primary h-1.5 rounded-lg bg-muted cursor-pointer"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-muted-foreground">Manual NDCU Cases Override:</span>
                      <span className="font-semibold text-foreground">{ndcuCases} cases</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="1500"
                      step="25"
                      value={ndcuCases}
                      onChange={(e) => setNdcuCases(Number(e.target.value))}
                      className="w-full accent-primary h-1.5 rounded-lg bg-muted cursor-pointer"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-muted-foreground">Manual Density Override:</span>
                      <span className="font-semibold text-foreground">{reportDensity} reports</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="25"
                      step="1"
                      value={reportDensity}
                      onChange={(e) => setReportDensity(Number(e.target.value))}
                      className="w-full accent-primary h-1.5 rounded-lg bg-muted cursor-pointer"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          <Button
            size="lg"
            className="w-full font-semibold shadow-md"
            onClick={submit}
            disabled={isAnalyzing}
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Running YOLOv8 &amp; ML Model...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" /> Run 2-Stage AI Risk Prediction
              </>
            )}
          </Button>
        </div>
      </div>
    </>
  );
}
