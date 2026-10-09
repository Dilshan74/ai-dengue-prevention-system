import { useRef, useState } from "react";
import {
  Camera,
  ImagePlus,
  UploadCloud,
  X,
  Sparkles,
  CheckCircle2,
  Scan,
  RefreshCw,
  FileCheck,
} from "lucide-react";
import Button from "../common/Button";
import { cn } from "../../utils/helpers";

const DETECTABLE_CLASSES = [
  { icon: "🛞", label: "Tires", color: "border-teal-500/30 bg-teal-500/10 text-teal-700 dark:text-teal-300" },
  { icon: "🥥", label: "Coconut Shells", color: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300" },
  { icon: "🚰", label: "Blocked Drains", color: "border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-300" },
  { icon: "🍾", label: "Discarded Bottles", color: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" },
  { icon: "🏺", label: "Flower Vases", color: "border-purple-500/30 bg-purple-500/10 text-purple-700 dark:text-purple-300" },
];

/** Drag-and-drop image picker with rich AI-scanner aesthetics and preview. */
export default function ImageUploader({ onSelect, hint = "PNG, JPG, WEBP up to 15MB" }) {
  const [preview, setPreview] = useState(null);
  const [fileMeta, setFileMeta] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef(null);

  const handleFile = (file) => {
    if (!file) return;
    setFileMeta({
      name: file.name,
      size: (file.size / (1024 * 1024)).toFixed(2) + " MB",
      type: file.type || "image/jpeg",
    });
    setPreview(URL.createObjectURL(file));
    onSelect?.(file);
  };

  const clear = () => {
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    setFileMeta(null);
    onSelect?.(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className="w-full">
      <div
        onDragOver={(event) => {
          event.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragOver(false);
          handleFile(event.dataTransfer.files?.[0]);
        }}
        className={cn(
          "relative flex min-h-[380px] flex-col items-center justify-center overflow-hidden rounded-2xl border-2 transition-all duration-300 p-6 md:p-8 text-center",
          dragOver
            ? "border-primary bg-primary/10 shadow-lg shadow-primary/20 scale-[0.99]"
            : preview
            ? "border-border/60 bg-card/60 shadow-inner"
            : "border-dashed border-primary/30 bg-gradient-to-b from-primary/[0.04] via-muted/30 to-card hover:border-primary/60 hover:bg-primary/[0.06] shadow-sm"
        )}
      >
        {preview ? (
          <div className="relative w-full flex flex-col items-center">
            {/* Active AI Scanning Badge */}
            <div className="mb-3 flex items-center justify-between w-full max-w-lg px-1">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 shadow-xs">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                AI Vision Pipeline Ready
              </span>
              {fileMeta && (
                <span className="text-[11px] font-mono text-muted-foreground flex items-center gap-1">
                  <FileCheck className="h-3.5 w-3.5 text-primary" />
                  {fileMeta.name} ({fileMeta.size})
                </span>
              )}
            </div>

            {/* Image Preview Container with Scanner Frame */}
            <div className="relative group max-h-[360px] w-full max-w-lg overflow-hidden rounded-2xl border border-border/80 bg-slate-950/5 shadow-md">
              <img
                src={preview}
                alt="Selected site preview"
                className="max-h-[360px] w-full object-contain rounded-2xl transition-transform duration-300 group-hover:scale-[1.01]"
              />

              {/* Holographic Corner Accents */}
              <div className="pointer-events-none absolute inset-0 border border-primary/20 rounded-2xl">
                <div className="absolute top-2 left-2 w-3 h-3 border-t-2 border-l-2 border-primary rounded-tl-sm"></div>
                <div className="absolute top-2 right-2 w-3 h-3 border-t-2 border-r-2 border-primary rounded-tr-sm"></div>
                <div className="absolute bottom-2 left-2 w-3 h-3 border-b-2 border-l-2 border-primary rounded-bl-sm"></div>
                <div className="absolute bottom-2 right-2 w-3 h-3 border-b-2 border-r-2 border-primary rounded-br-sm"></div>
              </div>

              {/* Scanning Target Watermark */}
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/15">
                <div className="rounded-full bg-background/80 backdrop-blur-md px-3 py-1 text-xs font-semibold text-foreground flex items-center gap-1.5 shadow-lg">
                  <Scan className="h-3.5 w-3.5 text-primary" /> Target Centered for YOLOv8
                </div>
              </div>
            </div>

            {/* Action Bar */}
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => inputRef.current?.click()}
                className="rounded-xl border-border hover:border-primary/50 text-xs font-medium"
              >
                <RefreshCw className="mr-1.5 h-3.5 w-3.5 text-muted-foreground" /> Change Photo
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={clear}
                className="rounded-xl bg-destructive/10 text-destructive hover:bg-destructive/20 border border-destructive/20 text-xs font-medium"
              >
                <X className="mr-1.5 h-3.5 w-3.5" /> Remove
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center max-w-md">
            {/* Glowing Icon Hub */}
            <div className="relative mb-4 flex items-center justify-center">
              <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-primary/30 to-teal-400/30 blur-lg opacity-70 animate-pulse"></div>
              <div className="relative flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-primary to-teal-600 text-white shadow-xl shadow-teal-500/25 ring-4 ring-primary/20">
                <UploadCloud className="h-10 w-10 transition-transform duration-300 hover:scale-110" />
              </div>
            </div>

            {/* Header Text */}
            <h4 className="text-lg font-bold text-foreground tracking-tight">
              Drag &amp; drop your breeding site photo
            </h4>
            <p className="mt-1 text-xs text-muted-foreground max-w-xs leading-relaxed">
              Upload high-resolution photos of standing water or discarded receptacles for immediate AI object detection.
            </p>

            {/* Quick Upload Buttons */}
            <div className="mt-5 flex flex-wrap justify-center gap-3 w-full">
              <Button
                onClick={() => inputRef.current?.click()}
                className="h-11 rounded-xl bg-gradient-to-r from-primary to-teal-600 px-5 text-xs font-semibold shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 hover:-translate-y-0.5 transition-all"
              >
                <ImagePlus className="mr-2 h-4 w-4" /> Browse Photo
              </Button>
              <Button
                variant="outline"
                onClick={() => inputRef.current?.click()}
                className="h-11 rounded-xl border-border bg-card/80 px-4 text-xs font-medium hover:border-primary/50 hover:bg-muted/50 hover:-translate-y-0.5 transition-all"
              >
                <Camera className="mr-2 h-4 w-4 text-primary" /> Camera Capture
              </Button>
            </div>

            <p className="mt-2 text-[11px] text-muted-foreground font-medium">
              Supported formats: {hint}
            </p>

            {/* Detectable Objects Pill Grid */}
            <div className="mt-6 pt-5 border-t border-border/60 w-full">
              <div className="flex items-center justify-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-2.5">
                <Sparkles className="h-3 w-3 text-primary" /> YOLOv8 Detectable Receptacles
              </div>
              <div className="flex flex-wrap items-center justify-center gap-1.5">
                {DETECTABLE_CLASSES.map((cls, i) => (
                  <span
                    key={i}
                    className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-[11px] font-medium transition-transform hover:scale-105 shadow-2xs ${cls.color}`}
                  >
                    <span>{cls.icon}</span>
                    <span>{cls.label}</span>
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(event) => handleFile(event.target.files?.[0])}
        />
      </div>
    </div>
  );
}
