import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  MapPin,
  Sparkles,
  Loader2,
  CloudRain,
  Activity,
  Layers,
  ChevronDown,
  ChevronUp,
  Crosshair,
  Map as MapIcon,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import Button from "../../../components/common/Button";
import PageHeader from "../../../components/common/PageHeader";
import { FormField, Input, Select, Textarea } from "../../../components/common/Field";
import ImageUploader from "../../../components/ai/ImageUploader";
import LocationPicker from "../../../components/maps/LocationPicker";
import { aiService } from "../../../services/aiService";

const CATEGORIES = [
  { value: "water", label: "Stagnant Water" },
  { value: "container", label: "Discarded Container (Tire, Coconut, Bottle)" },
  { value: "drain", label: "Blocked Drain / Gutter" },
  { value: "other", label: "Other Water Holding Site" },
];

const VERIFIED_LOCATIONS = [
  { value: "Nugegoda, Ward 12 (Colombo)", label: "Nugegoda, Ward 12 (Colombo)", lat: 6.8712, lon: 79.8890, rainfall: 125, cases: 980, density: 8, district: "Colombo" },
  { value: "Colombo 03 (Kollupitiya)", label: "Colombo 03 (Kollupitiya)", lat: 6.9070, lon: 79.8510, rainfall: 120, cases: 1050, density: 9, district: "Colombo" },
  { value: "Colombo 07 (Cinnamon Gardens)", label: "Colombo 07 (Cinnamon Gardens)", lat: 6.9125, lon: 79.8660, rainfall: 120, cases: 990, density: 8, district: "Colombo" },
  { value: "Dehiwala - Mount Lavinia", label: "Dehiwala - Mount Lavinia (Colombo)", lat: 6.8402, lon: 79.8712, rainfall: 125, cases: 920, density: 7, district: "Colombo" },
  { value: "Maharagama", label: "Maharagama (Colombo)", lat: 6.8480, lon: 79.9265, rainfall: 125, cases: 880, density: 7, district: "Colombo" },
  { value: "Kelaniya, Ward 4 (Gampaha)", label: "Kelaniya, Ward 4 (Gampaha)", lat: 6.9538, lon: 79.9144, rainfall: 110, cases: 750, density: 6, district: "Gampaha" },
  { value: "Negombo Municipal (Gampaha)", label: "Negombo Municipal (Gampaha)", lat: 7.2083, lon: 79.8358, rainfall: 110, cases: 680, density: 6, district: "Gampaha" },
  { value: "Panadura, Ward 2 (Kalutara)", label: "Panadura, Ward 2 (Kalutara)", lat: 6.7134, lon: 79.9074, rainfall: 135, cases: 480, density: 5, district: "Kalutara" },
  { value: "Peradeniya (Kandy)", label: "Peradeniya (Kandy)", lat: 7.2600, lon: 80.5900, rainfall: 85, cases: 420, density: 4, district: "Kandy" },
  { value: "Kandy Municipal Area", label: "Kandy Municipal Area", lat: 7.2906, lon: 80.6337, rainfall: 95, cases: 450, density: 5, district: "Kandy" },
  { value: "Karapitiya (Galle)", label: "Karapitiya (Galle)", lat: 6.0645, lon: 80.2290, rainfall: 90, cases: 310, density: 3, district: "Galle" },
  { value: "Galle Fort", label: "Galle Fort", lat: 6.0267, lon: 80.2170, rainfall: 90, cases: 290, density: 3, district: "Galle" },
  { value: "Kurunegala Town", label: "Kurunegala Town", lat: 7.4863, lon: 80.3623, rainfall: 80, cases: 380, density: 4, district: "Kurunegala" },
  { value: "custom", label: "✍️ Enter Other Address / Custom Location...", lat: 6.8712, lon: 79.8890, rainfall: 100, cases: 500, density: 5, district: "Western Province" },
];

export default function UploadImage() {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [selectedPreset, setSelectedPreset] = useState("Nugegoda, Ward 12 (Colombo)");
  const [customLocationText, setCustomLocationText] = useState("");
  const [category, setCategory] = useState("container");
  const [description, setDescription] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Geolocation coordinates
  const [coords, setCoords] = useState({ lat: 6.8712, lon: 79.8890, gpsActive: false, isLocating: false });
  const [showMap, setShowMap] = useState(false);
  const [gpsBlocked, setGpsBlocked] = useState(false);

  // Optional manual simulation mode (for testing / developers)
  const [simulationMode, setSimulationMode] = useState(false);
  const [rainfallMm, setRainfallMm] = useState(125);
  const [ndcuCases, setNdcuCases] = useState(980);
  const [reportDensity, setReportDensity] = useState(8);

  const activeLocation = selectedPreset === "custom" ? (customLocationText || "Custom Location") : selectedPreset;

  // Reverse geocoding helper (OpenStreetMap Nominatim)
  const reverseGeocode = async (lat, lon) => {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`, {
        headers: { "User-Agent": "DengueGuard-App/1.0" }
      });
      const data = await res.json();
      if (data && data.display_name) {
        const parts = data.display_name.split(",").map((p) => p.trim());
        return parts.slice(0, 3).join(", ");
      }
    } catch {
      // Graceful fallback
    }
    return null;
  };

  // One-click live GPS detection
  const detectLiveGPS = () => {
    if (!("geolocation" in navigator)) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }

    setCoords((prev) => ({ ...prev, isLocating: true }));
    toast.info("Accessing device GPS coordinates...");

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = Number(pos.coords.latitude.toFixed(4));
        const lon = Number(pos.coords.longitude.toFixed(4));

        setCoords({ lat, lon, gpsActive: true, isLocating: false });
        setGpsBlocked(false);

        const addr = await reverseGeocode(lat, lon);
        if (addr) {
          setSelectedPreset("custom");
          setCustomLocationText(addr);
          toast.success(`Location detected: ${addr}`);
        } else {
          toast.success(`GPS coordinates locked: ${lat}° N, ${lon}° E`);
        }
      },
      (err) => {
        setCoords((prev) => ({ ...prev, isLocating: false }));
        if (err.code === 1) { // PERMISSION_DENIED
          setGpsBlocked(true);
          toast.error("Browser location permission blocked. See instructions below to unblock or choose from dropdown.");
        } else {
          toast.error(`GPS Error: ${err.message || "Could not retrieve position"}`);
        }
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  // Handle Preset dropdown change
  const handlePresetChange = (presetValue) => {
    setSelectedPreset(presetValue);
    const found = VERIFIED_LOCATIONS.find((p) => p.value === presetValue);
    if (found && presetValue !== "custom") {
      setCoords({ lat: found.lat, lon: found.lon, gpsActive: false, isLocating: false });
      setRainfallMm(found.rainfall);
      setNdcuCases(found.cases);
      setReportDensity(found.density);
    }
  };

  // Handle Map Pinning
  const handleMapPin = async (newPos) => {
    if (!newPos) return;
    const lat = Number(newPos.lat.toFixed(4));
    const lon = Number(newPos.lng.toFixed(4));
    setCoords({ lat, lon, gpsActive: true, isLocating: false });

    const addr = await reverseGeocode(lat, lon);
    if (addr) {
      setSelectedPreset("custom");
      setCustomLocationText(addr);
    }
  };

  const submit = async () => {
    if (!file) {
      toast.error("Add a photo of the site before submitting");
      return;
    }

    try {
      setIsAnalyzing(true);
      toast.info("Analyzing with YOLOv8 Vision & Random Forest ML...");

      const payload = {
        location: activeLocation,
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
          location: activeLocation,
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
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-foreground">Location &amp; Details</h3>
              <button
                type="button"
                onClick={detectLiveGPS}
                disabled={coords.isLocating}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary/80 transition-colors bg-primary/10 border border-primary/20 px-2.5 py-1 rounded-lg"
              >
                {coords.isLocating ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" /> Detecting GPS...
                  </>
                ) : (
                  <>
                    <Crosshair className="h-3.5 w-3.5" /> Detect My GPS
                  </>
                )}
              </button>
            </div>

            {gpsBlocked && (
              <div className="mb-4 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-800 dark:text-amber-200">
                <div className="font-semibold flex items-center gap-1.5 text-amber-700 dark:text-amber-300 mb-1">
                  <AlertTriangle className="h-4 w-4" /> Browser GPS is blocked
                </div>
                <p className="leading-relaxed">
                  Your browser blocked location access for localhost. To enable device GPS:
                </p>
                <ol className="list-decimal list-inside mt-1 space-y-1 opacity-90 pl-1">
                  <li>Click the <strong>tune / sliders icon</strong> (or lock 🔒) in the address bar next to the URL.</li>
                  <li>Set <strong>Location</strong> to <strong>Allow</strong>.</li>
                  <li>Refresh this page and click <strong>Detect My GPS</strong> again.</li>
                </ol>
                <div className="mt-2 pt-2 border-t border-amber-500/20 text-[11px] font-medium text-foreground">
                  💡 <strong>No GPS needed!</strong> You can also just pick your area from the dropdown below.
                </div>
              </div>
            )}

            <div className="space-y-4">
              {/* Verified Location Selector (Prevents Typo Errors) */}
              <FormField label="Select Area / District" htmlFor="presetLocation">
                <Select
                  id="presetLocation"
                  value={selectedPreset}
                  onChange={(e) => handlePresetChange(e.target.value)}
                  options={VERIFIED_LOCATIONS.map((l) => ({ value: l.value, label: l.label }))}
                />
              </FormField>

              {/* Free-text input only appears if 'Custom' is chosen */}
              {selectedPreset === "custom" && (
                <FormField label="Exact Street Address / Landmark" htmlFor="customLocation">
                  <Input
                    id="customLocation"
                    icon={MapPin}
                    value={customLocationText}
                    onChange={(e) => setCustomLocationText(e.target.value)}
                    placeholder="e.g. Stanley Thilakarathne Mawatha, Nugegoda"
                  />
                </FormField>
              )}

              {/* Verified GPS Status & Map Toggle */}
              <div className="rounded-xl border border-dashed border-border bg-muted/30 p-2.5 text-xs text-muted-foreground flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-foreground font-medium">
                    📍 {coords.lat}° N, {coords.lon}° E
                  </span>
                  {coords.gpsActive && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
                      <CheckCircle2 className="h-3 w-3" /> Live GPS
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setShowMap(!showMap)}
                  className="inline-flex items-center gap-1 text-primary hover:underline font-medium"
                >
                  <MapIcon className="h-3.5 w-3.5" />
                  {showMap ? "Hide Map" : "Pin on Map"}
                </button>
              </div>

              {/* Interactive Map Pinning */}
              {showMap && (
                <div className="rounded-xl border border-border p-2 bg-muted/20">
                  <div className="text-[11px] text-muted-foreground mb-1.5 flex items-center justify-between">
                    <span>Click or tap anywhere on the map to pin the exact hazard location:</span>
                  </div>
                  <LocationPicker
                    value={{ lat: coords.lat, lng: coords.lon }}
                    onChange={handleMapPin}
                  />
                </div>
              )}

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
                  className="min-h-[75px] resize-none"
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
