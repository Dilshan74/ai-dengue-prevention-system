import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MapPin, Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";
import Button from "../../../components/common/Button";
import PageHeader from "../../../components/common/PageHeader";
import { FormField, Input, Select, Textarea } from "../../../components/common/Field";
import ImageUploader from "../../../components/ai/ImageUploader";
import { aiService } from "../../../services/aiService";

const CATEGORIES = [
  { value: "water", label: "Stagnant Water" },
  { value: "container", label: "Discarded Container" },
  { value: "drain", label: "Blocked Drain" },
  { value: "other", label: "Other" },
];

export default function UploadImage() {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [location, setLocation] = useState("Nugegoda, Ward 12");
  const [category, setCategory] = useState("water");
  const [description, setDescription] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const submit = async () => {
    if (!file) {
      toast.error("Add a photo of the site before submitting");
      return;
    }

    try {
      setIsAnalyzing(true);
      toast.info("Analyzing image with DengueGuard AI model...");

      const prediction = await aiService.predict(file, {
        location,
        category,
        description,
      });

      toast.success("AI Analysis completed!");
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
        description="Snap or upload a photo of stagnant water or suspicious debris."
      />

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="soft-shadow rounded-2xl border border-border bg-card p-6">
          <ImageUploader onSelect={setFile} />
        </div>

        <div className="space-y-4">
          <div className="soft-shadow rounded-2xl border border-border bg-card p-6">
            <h3 className="mb-4 font-semibold">Location &amp; Details</h3>
            <div className="space-y-4">
              <FormField label="Location" htmlFor="location">
                <Input
                  id="location"
                  icon={MapPin}
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
                <div className="rounded-xl border border-dashed border-border bg-muted/30 p-3 text-xs text-muted-foreground">
                  📍 GPS: 6.8712° N, 79.8890° E — auto-detected
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
                  placeholder="Describe what you observed…"
                  className="min-h-[100px] resize-none"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </FormField>
            </div>
          </div>

          <Button
            size="lg"
            className="w-full font-semibold"
            onClick={submit}
            disabled={isAnalyzing}
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Analyzing with YOLO Model...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" /> Submit for AI Analysis
              </>
            )}
          </Button>
        </div>
      </div>
    </>
  );
}
