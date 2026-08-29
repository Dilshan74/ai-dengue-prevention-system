import { useRef, useState } from "react";
import { MapPin, X, ImagePlus, FileSearch } from "lucide-react";
import { toast } from "sonner";
import Button from "../../../components/common/Button";
import { FormField, Input, Textarea } from "../../../components/common/Field";
import LocationPicker from "../../../components/maps/LocationPicker";
import { rules, validate } from "../../../utils/validators";
import citizenService from "../../../services/citizenService";

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
  const fileRef = useRef(null);

  const onChange = (field) => (e) => {
    setValues((prev) => ({ ...prev, [field]: e.target.value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const handleFiles = (e) => {
    const selected = Array.from(e.target.files ?? []).slice(0, 5);
    setFiles(selected);
    setPreviews(selected.map((f) => URL.createObjectURL(f)));
  };

  const removeFile = (index) => {
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
      toast.success("Complaint submitted successfully!");
      onCreated?.();
    } catch (err) {
      toast.error(err?.response?.data?.message ?? "Failed to submit complaint");
    } finally {
      setLoading(false);
    }
  };

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="relative w-full max-w-lg rounded-2xl bg-card border border-border shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div>
            <h2 className="text-base font-semibold text-foreground">New Complaint</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Report a dengue risk site in your neighbourhood
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={submit} noValidate>
          <div className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">
            {/* Description */}
            <FormField
              label="Description"
              htmlFor="cc-description"
              error={errors.description}
            >
              <Textarea
                id="cc-description"
                placeholder="Describe what you observed — e.g. stagnant water in a container near the road…"
                value={values.description}
                onChange={onChange("description")}
                error={errors.description}
                className="min-h-[90px] resize-none"
                disabled={loading}
              />
            </FormField>

            {/* Location */}
            <FormField
              label="Location / Area"
              htmlFor="cc-location"
              error={errors.location}
            >
              <Input
                id="cc-location"
                icon={MapPin}
                placeholder="e.g. Nugegoda, Ward 12"
                value={values.location}
                onChange={onChange("location")}
                error={errors.location}
                disabled={loading}
              />
            </FormField>

            {/* Address */}
            <FormField
              label="Full Address (optional)"
              htmlFor="cc-address"
            >
              <Input
                id="cc-address"
                placeholder="e.g. 45B Temple Road, Nugegoda"
                value={values.address}
                onChange={onChange("address")}
                disabled={loading}
              />
            </FormField>

            {/* Map Location Picker */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Pin Location on Map (optional)
              </label>
              <LocationPicker value={coords} onChange={setCoords} />
            </div>

            {/* Image upload */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Photos (optional, up to 5)
              </label>
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
                  className="flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-muted/30 p-6 text-muted-foreground hover:border-primary/50 hover:bg-primary/5 transition-colors disabled:pointer-events-none"
                >
                  <ImagePlus className="h-8 w-8 opacity-50" />
                  <span className="text-sm font-medium">Click to add photos</span>
                  <span className="text-xs opacity-70">JPG, PNG up to 10MB each</span>
                </button>
              ) : (
                <div className="grid grid-cols-4 gap-2">
                  {previews.map((src, i) => (
                    <div key={i} className="relative aspect-square rounded-lg overflow-hidden border border-border group">
                      <img src={src} alt={`preview-${i}`} className="h-full w-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeFile(i)}
                        className="absolute top-1 right-1 rounded-full bg-black/60 p-0.5 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                        aria-label="Remove"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                  {previews.length < 5 && (
                    <button
                      type="button"
                      onClick={() => fileRef.current?.click()}
                      disabled={loading}
                      className="aspect-square rounded-lg border-2 border-dashed border-border flex items-center justify-center text-muted-foreground hover:border-primary/50 transition-colors"
                    >
                      <ImagePlus className="h-5 w-5" />
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Info notice */}
            <div className="rounded-xl bg-primary/5 border border-primary/20 p-3 text-xs text-primary/80">
              <FileSearch className="inline h-3.5 w-3.5 mr-1.5 -mt-0.5" />
              Your complaint will be reviewed by an administrator who will assign a PHI inspector.
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 border-t border-border px-6 py-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Submitting…" : "Submit Complaint"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
