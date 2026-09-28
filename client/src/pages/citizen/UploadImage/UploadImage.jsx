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

  // Environmental inputs for the Random Forest ML Model
  const [showMlParams, setShowMlParams] = useState(false);
  const [rainfallMm, setRainfallMm] = useState(125);
  const [ndcuCases, setNdcuCases] = useState(980);
  const [reportDensity, setReportDensity] = useState(8);

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

      const prediction = await aiService.predict(file, {
        location,
        category,
        description,
        rainfall_mm: rainfallMm,
        ndcu_cases: ndcuCases,
        report_density: reportDensity,
      });

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
                  <span>📍 GPS: 6.8712° N, 79.8890° E</span>
                  <span className="font-medium text-primary">Sri Lanka Western Province</span>
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

          {/* Machine Learning Multi-Factor Environmental Inputs */}
          <div className="soft-shadow rounded-2xl border border-border bg-card p-5">
            <button
              type="button"
              onClick={() => setShowMlParams(!showMlParams)}
              className="flex w-full items-center justify-between text-left"
            >
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold text-foreground">
                  ML Risk Parameters (CSV Dataset Features)
                </span>
              </div>
              <span className="text-xs text-muted-foreground flex items-center gap-1 font-medium">
                {showMlParams ? "Hide" : "Customize"}
                {showMlParams ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
              </span>
            </button>

            <p className="mt-1 text-xs text-muted-foreground">
              These factors are combined with YOLO visual detections to compute the multi-factor risk score.
            </p>

            {showMlParams ? (
              <div className="mt-4 space-y-3 pt-3 border-t border-border">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <CloudRain className="h-3.5 w-3.5 text-sky-500" /> Recent Rainfall (7-day mm)
                    </span>
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
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <Activity className="h-3.5 w-3.5 text-amber-500" /> NDCU District Cases
                    </span>
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
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <Layers className="h-3.5 w-3.5 text-indigo-500" /> Report Density (2km radius)
                    </span>
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
            ) : (
              <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
                <div className="rounded-xl bg-muted/40 p-2">
                  <div className="text-[10px] text-muted-foreground">Rainfall</div>
                  <div className="font-semibold text-foreground">{rainfallMm} mm</div>
                </div>
                <div className="rounded-xl bg-muted/40 p-2">
                  <div className="text-[10px] text-muted-foreground">NDCU Cases</div>
                  <div className="font-semibold text-foreground">{ndcuCases}</div>
                </div>
                <div className="rounded-xl bg-muted/40 p-2">
                  <div className="text-[10px] text-muted-foreground">Density</div>
                  <div className="font-semibold text-foreground">{reportDensity}/2km</div>
                </div>
              </div>
            )}
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
