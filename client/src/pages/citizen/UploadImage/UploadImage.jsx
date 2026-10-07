import { useState } from "react";
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
import { FormField, Input, Label, Select, Textarea } from "../../../components/common/Field";
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
  const [locationText, setLocationText] = useState("");
  const [category, setCategory] = useState("container");
  const [description, setDescription] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Geolocation coordinates
  const [coords, setCoords] = useState({
    lat: null,
    lon: null,
    accuracy: null,
    gpsActive: false,
    isLocating: false,
  });
  const [showMap, setShowMap] = useState(false);
  const [gpsBlocked, setGpsBlocked] = useState(false);

  // Optional manual simulation mode (for testing / developers)
  const [simulationMode, setSimulationMode] = useState(false);
  const [rainfallMm, setRainfallMm] = useState(125);
  const [ndcuCases, setNdcuCases] = useState(980);
  const [reportDensity, setReportDensity] = useState(8);

  const activeLocation = locationText.trim() || (coords.gpsActive && coords.lat != null ? `${coords.lat.toFixed(6)}° N, ${coords.lon.toFixed(6)}° E` : "");

  const findClosestDistrict = (lat, lon) => {
    let closest = VERIFIED_LOCATIONS[0];
    let minDiff = Infinity;
    for (const loc of VERIFIED_LOCATIONS) {
      if (loc.value === "custom") continue;
      const diff = Math.hypot(loc.lat - lat, loc.lon - lon);
      if (diff < minDiff) {
        minDiff = diff;
        closest = loc;
      }
    }
    return closest;
  };

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

    setCoords({
      lat: null,
      lon: null,
      accuracy: null,
      gpsActive: false,
      isLocating: true,
    });
    setLocationText("");
    toast.info("Accessing device GPS coordinates...");

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;

        setCoords({
          lat,
          lon,
          accuracy: pos.coords.accuracy,
          gpsActive: true,
          isLocating: false,
        });
        setGpsBlocked(false);
        setLocationText(`${lat.toFixed(6)}, ${lon.toFixed(6)}`);

        const addr = await reverseGeocode(lat, lon);
        if (addr) {
          setLocationText(addr);
          toast.success(`Location detected: ${addr}`);
        } else {
          toast.success(`GPS coordinates locked: ${lat}° N, ${lon}° E`);
        }

        const closest = findClosestDistrict(lat, lon);
        setRainfallMm(closest.rainfall);
        setNdcuCases(closest.cases);
        setReportDensity(closest.density);
      },
      (err) => {
        setCoords((prev) => ({ ...prev, isLocating: false }));
        if (err.code === 1) { // PERMISSION_DENIED
          setGpsBlocked(true);
          toast.error("Browser location permission blocked. Please allow location access or type your area.");
        } else {
          toast.error(`GPS Error: ${err.message || "Could not retrieve position"}`);
        }
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  // Handle Map Pinning
  const handleMapPin = async (newPos) => {
    if (!newPos) return;
    const lat = newPos.lat;
    const lon = newPos.lng;
    setCoords({ lat, lon, accuracy: null, gpsActive: true, isLocating: false });
    setLocationText(`${lat.toFixed(6)}, ${lon.toFixed(6)}`);

    const addr = await reverseGeocode(lat, lon);
    if (addr) {
      setLocationText(addr);
    }
    const closest = findClosestDistrict(lat, lon);
    setRainfallMm(closest.rainfall);
    setNdcuCases(closest.cases);
    setReportDensity(closest.density);
  };

  const submit = async () => {
    if (!file) {
      toast.error("Add a photo of the site before submitting");
      return;
    }

    if (!activeLocation) {
      toast.error("Please click 'Detect My GPS' or type your area / district");
      return;
    }

    try {
      setIsAnalyzing(true);
      toast.info("Analyzing with YOLOv8 Vision & Random Forest ML...");

      const payload = {
        location: activeLocation,
        category,
        description,
        ...(coords.gpsActive && coords.lat != null && coords.lon != null
          ? { latitude: coords.lat, longitude: coords.lon }
          : {}),
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
          coords:
            coords.gpsActive && coords.lat != null && coords.lon != null
              ? { lat: coords.lat, lng: coords.lon }
              : null,
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
              {coords.gpsActive && (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md">
                  <CheckCircle2 className="h-3 w-3" /> Live GPS Locked
                </span>
              )}
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
                  💡 <strong>No GPS needed!</strong> You can also type your area name directly or use Pin on Map below.
                </div>
              </div>
            )}

            <div className="space-y-4">
              {/* Area / District with integrated Detect My GPS button */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="areaLocation" className="text-sm font-medium text-foreground">
                    Area / District
                  </Label>
                  <span className="text-[11px] text-muted-foreground">Click Detect My GPS or type</span>
                </div>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                      id="areaLocation"
                      type="text"
                      value={locationText}
                      onChange={(e) => setLocationText(e.target.value)}
                      placeholder="Click 'Detect My GPS' or type area / district..."
                      className="h-10 w-full rounded-xl border border-input bg-card pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary shadow-xs"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={detectLiveGPS}
                    disabled={coords.isLocating}
                    className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-60 transition-colors cursor-pointer"
                  >
                    {coords.isLocating ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" /> Detecting...
                      </>
                    ) : (
                      <>
                        <Crosshair className="h-3.5 w-3.5" /> Detect My GPS
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Verified GPS Status & Map Toggle */}
              <div className="rounded-xl border border-dashed border-border bg-muted/30 p-2.5 text-xs text-muted-foreground flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-foreground font-medium text-xs">
                    {coords.gpsActive && coords.lat != null ? (
                      `📍 ${coords.lat.toFixed(6)}° N, ${coords.lon.toFixed(6)}° E${
                        coords.accuracy != null
                          ? ` (±${Math.round(coords.accuracy)} m)`
                          : ""
                      }`
                    ) : (
                      <span className="text-muted-foreground font-normal">
                        📍 GPS: Not detected yet
                      </span>
                    )}
                  </span>
                  {coords.gpsActive && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
                      <CheckCircle2 className="h-3 w-3" /> Live GPS Locked
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setShowMap(!showMap)}
                  className="inline-flex items-center gap-1 text-primary hover:underline font-medium cursor-pointer"
                >
                  <MapIcon className="h-3.5 w-3.5" />
                  {showMap ? "Hide Map" : "Pin on Map"}
                </button>
              </div>

              {/* Interactive Map Pinning */}
              {showMap && (
                <div className="rounded-xl border border-border p-2 bg-muted/20">
                  <div className="text-[11px] text-muted-foreground mb-1.5 flex items-center justify-between">
                    <span>
                      Use the GPS button below to place your current location, or click the map when Google Maps is enabled:
                    </span>
                  </div>
                  <LocationPicker
                    value={coords.lat != null && coords.lon != null ? { lat: coords.lat, lng: coords.lon } : null}
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
