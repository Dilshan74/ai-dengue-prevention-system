import { useRef, useState } from "react";
import {
  MapPin,
  X,
  ImagePlus,
  FileSearch,
  Crosshair,
  Map as MapIcon,
  CheckCircle2,
  AlertCircle,
  ShieldAlert,
  Loader2,
  Camera,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import Button from "../../../components/common/Button";
import { FormField, Input, Textarea, Label } from "../../../components/common/Field";
import LocationPicker from "../../../components/maps/LocationPicker";
import { rules, validate } from "../../../utils/validators";
import citizenService from "../../../services/citizenService";

const QUICK_DISTRICTS = [
  "Nugegoda, Ward 12",
  "Colombo 03",
  "Gampaha Town",
  "Kandy City",
  "Galle Fort",
];

const QUICK_TAGS = [
  "Discarded car tyres with stagnant water",
  "Coconut husks / shells in open garden",
  "Blocked concrete drainage gutter",
  "Uncovered plastic water barrel",
];

export default function CreateComplaint({ onClose, onCreated }) {
  const [values, setValues] = useState({
    description: "",
    location: "",
    address: "",
  });
  const [coords, setCoords] = useState(null);
  const [errors, setErrors] = useState({});
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const fileRef = useRef(null);

  const onChange = (field) => (e) => {
    setValues((prev) => ({ ...prev, [field]: e.target.value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const handleFiles = (e) => {
    const selected = Array.from(e.target.files ?? []).slice(0, 5 - files.length);
    if (selected.length === 0) return;
    setFiles((prev) => [...prev, ...selected].slice(0, 5));
    setPreviews((prev) => [
      ...prev,
      ...selected.map((f) => URL.createObjectURL(f)),
    ].slice(0, 5));
  };

  const removeFile = (index) => {
    if (previews[index]) URL.revokeObjectURL(previews[index]);
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const submit = async (e) => {
    e.preventDefault();

    const nextErrors = validate(values, {
      description: [rules.required("Description is required")],
      location: [rules.required("Location is required")],
    });
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    const formData = new FormData();
    formData.append("description", values.description.trim());
    formData.append("location", values.location.trim());
    formData.append("address", values.address.trim() || values.location.trim());
    if (coords) {
      formData.append("lat", coords.lat);
      formData.append("lng", coords.lng);
    }
    files.forEach((f) => formData.append("image", f));

    try {
      setLoading(true);
      await citizenService.createComplaint(formData);
      toast.success("Complaint submitted successfully and queued for PHI review!");
      onCreated?.();
    } catch (err) {
      toast.error(err?.response?.data?.message ?? "Failed to submit complaint");
    } finally {
      setLoading(false);
    }
  };

  return (
    /* Modal Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-3 md:p-6 animate-fade-in"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="relative w-full max-w-3xl rounded-3xl bg-card border border-border/80 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-border/70 px-6 py-4.5 bg-muted/20">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br from-primary to-teal-600 text-white shadow-md shadow-primary/20">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground tracking-tight">
                Report Dengue Hazard Site
              </h2>
              <p className="text-xs text-muted-foreground">
                Dispatches a high-priority inspection ticket directly to the local PHI officer
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={submit} noValidate className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
            <div className="grid md:grid-cols-2 gap-6 items-start">
              {/* Left Column: Description & Photos */}
              <div className="space-y-4">
                {/* Description */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="cc-description">Description &amp; Hazard Details</Label>
                    <span className="text-[10px] text-muted-foreground">Required</span>
                  </div>
                  <Textarea
                    id="cc-description"
                    placeholder="Describe what you observed (e.g. 4 discarded tyres filled with standing rainwater behind building)..."
                    value={values.description}
                    onChange={onChange("description")}
                    error={errors.description}
                    className="min-h-[110px] resize-none text-xs"
                    disabled={loading}
                  />

                  {/* Quick Description Suggestions */}
                  <div className="flex flex-wrap gap-1 pt-1">
                    {QUICK_TAGS.map((tag, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() =>
                          setValues((prev) => ({
                            ...prev,
                            description: prev.description ? `${prev.description}. ${tag}` : tag,
                          }))
                        }
                        className="rounded-md border border-border/70 bg-muted/30 px-2 py-0.5 text-[10px] text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors cursor-pointer"
                      >
                        + {tag}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Photos Upload */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Photographic Evidence (Up to 5)</Label>
                    <span className="text-[10px] font-mono text-muted-foreground">
                      {files.length} / 5 photos
                    </span>
                  </div>

                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleFiles}
                  />

                  {previews.length === 0 ? (
                    <button
                      type="button"
                      onClick={() => fileRef.current?.click()}
                      disabled={loading}
                      className="flex w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border/80 bg-muted/20 p-6 text-muted-foreground hover:border-primary/60 hover:bg-primary/[0.04] transition-all cursor-pointer"
                    >
                      <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
                        <ImagePlus className="h-5 w-5" />
                      </div>
                      <span className="text-xs font-semibold text-foreground">Click to upload photos</span>
                      <span className="text-[11px] text-muted-foreground">PNG, JPG, WEBP up to 10MB each</span>
                    </button>
                  ) : (
                    <div className="grid grid-cols-3 gap-2.5">
                      {previews.map((src, i) => (
                        <div
                          key={i}
                          className="relative aspect-video rounded-xl overflow-hidden border border-border group bg-muted"
                        >
                          <img
                            src={src}
                            alt={`preview-${i}`}
                            className="h-full w-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => removeFile(i)}
                            className="absolute top-1.5 right-1.5 rounded-lg bg-black/70 p-1 text-white hover:bg-destructive transition-colors cursor-pointer"
                            aria-label="Remove photo"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                      {previews.length < 5 && (
                        <button
                          type="button"
                          onClick={() => fileRef.current?.click()}
                          disabled={loading}
                          className="aspect-video rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-1 text-muted-foreground hover:border-primary hover:text-primary transition-colors cursor-pointer bg-muted/20"
                        >
                          <ImagePlus className="h-4 w-4" />
                          <span className="text-[10px] font-medium">+ Add Photo</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Location, Address & Map */}
              <div className="space-y-4">
                {/* Location / Area */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="cc-location">Area / District / Ward</Label>
                    <span className="text-[10px] text-muted-foreground">Required</span>
                  </div>
                  <Input
                    id="cc-location"
                    icon={MapPin}
                    placeholder="e.g. Nugegoda, Ward 12"
                    value={values.location}
                    onChange={onChange("location")}
                    error={errors.location}
                    disabled={loading}
                  />

                  {/* Quick District Pills */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {QUICK_DISTRICTS.map((dst, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() =>
                          setValues((prev) => ({
                            ...prev,
                            location: dst,
                          }))
                        }
                        className="rounded-md border border-border/70 bg-muted/30 px-2 py-0.5 text-[10px] text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors cursor-pointer"
                      >
                        📍 {dst}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Street Address / Landmark */}
                <FormField
                  label="Street Address / Landmark (Optional)"
                  htmlFor="cc-address"
                >
                  <Input
                    id="cc-address"
                    placeholder="e.g. 45B Temple Road, near junction"
                    value={values.address}
                    onChange={onChange("address")}
                    disabled={loading}
                  />
                </FormField>

                {/* Interactive Map Pinning Toggle */}
                <div className="rounded-2xl border border-border/80 bg-muted/20 p-3.5 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MapIcon className="h-4 w-4 text-primary" />
                      <span className="text-xs font-semibold text-foreground">
                        GPS Map Coordinates
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowMap(!showMap)}
                      className="text-xs font-semibold text-primary hover:underline cursor-pointer"
                    >
                      {showMap ? "Hide Map" : "Open Map"}
                    </button>
                  </div>

                  {coords ? (
                    <div className="flex items-center gap-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 text-xs text-emerald-700 dark:text-emerald-300 font-mono">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                      <span>{coords.lat.toFixed(5)}° N, {coords.lng.toFixed(5)}° E</span>
                    </div>
                  ) : (
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      Coordinates help PHI officers pinpoint the exact breeding spot during physical field visits.
                    </p>
                  )}

                  {showMap && (
                    <div className="pt-1 animate-fade-in">
                      <LocationPicker value={coords} onChange={setCoords} />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Public Health Assurance Notice */}
            <div className="rounded-2xl bg-primary/5 border border-primary/20 p-3.5 text-xs text-foreground/90 flex items-start gap-2.5">
              <FileSearch className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <div className="leading-relaxed">
                <strong>Public Health Protocol: </strong>
                Once submitted, this complaint is geo-tagged and instantly routed to the Public Health Department. The designated PHI officer for this area will receive an alert to conduct physical larval sampling and source reduction.
              </div>
            </div>
          </div>

          {/* Modal Sticky Footer */}
          <div className="flex items-center justify-between border-t border-border/70 px-6 py-4 bg-muted/20">
            <span className="text-[11px] text-muted-foreground hidden sm:inline">
              Citizen Reporting Portal · DengueGuard AI
            </span>
            <div className="flex items-center gap-2.5 ml-auto">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={loading}
                className="rounded-xl px-4 text-xs font-semibold"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="rounded-xl bg-gradient-to-r from-primary to-teal-600 px-5 text-xs font-bold text-white shadow-md shadow-primary/20 hover:shadow-primary/30"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> Submitting...
                  </>
                ) : (
                  "Submit Complaint"
                )}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
