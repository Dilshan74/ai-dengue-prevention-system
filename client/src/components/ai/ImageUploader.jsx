import { useRef, useState } from "react";
import { Camera, ImagePlus, Upload, X, Crosshair } from "lucide-react";
import Button from "../common/Button";
import { cn } from "../../utils/helpers";
import BoundingBoxOverlay from "../BoundingBoxOverlay";

/** Utilitarian Evidence Media Ingestion Dropzone with BoundingBoxOverlay */
export default function ImageUploader({
  onSelect,
  predictions = [],
  isScanning = false,
  hint = "RAW, JPEG, PNG format • Max 10MB",
}) {
  const [preview, setPreview] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef(null);

  const handleFile = (file) => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPreview(url);
    onSelect?.(file, url);
  };

  const clear = () => {
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    onSelect?.(null, null);
  };

  return (
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
        "relative flex min-h-[300px] flex-col items-center justify-center rounded-lg border border-dashed transition-colors p-4 sm:p-6",
        dragOver ? "border-teal-500 bg-teal-500/5" : "border-slate-300 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40",
      )}
    >
      {/* HUD Corner Reticles on Dropzone */}
      <div className="absolute top-2 left-2 h-3 w-3 border-t-2 border-l-2 border-slate-400 dark:border-slate-700 pointer-events-none" />
      <div className="absolute top-2 right-2 h-3 w-3 border-t-2 border-r-2 border-slate-400 dark:border-slate-700 pointer-events-none" />
      <div className="absolute bottom-2 left-2 h-3 w-3 border-b-2 border-l-2 border-slate-400 dark:border-slate-700 pointer-events-none" />
      <div className="absolute bottom-2 right-2 h-3 w-3 border-b-2 border-r-2 border-slate-400 dark:border-slate-700 pointer-events-none" />

      {preview ? (
        <div className="w-full flex flex-col items-center gap-3">
          <BoundingBoxOverlay
            imageUrl={preview}
            predictions={predictions}
            isScanning={isScanning}
          />
          <div className="flex items-center gap-2 mt-1">
            <Button
              size="sm"
              variant="outline"
              onClick={clear}
              disabled={isScanning}
              className="text-xs font-mono"
            >
              <X className="h-3.5 w-3.5" /> RE-ACQUIRE MEDIA
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="grid h-12 w-12 place-items-center rounded-md border border-teal-500/30 bg-teal-500/10 text-teal-600 dark:text-teal-400">
            <Crosshair className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-semibold tracking-tight text-foreground font-mono">
              EVIDENCE MEDIA INGESTION
            </p>
            <p className="text-xs text-muted-foreground mt-0.5 font-mono">
              Drop target image or click to browse local files
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-500 mt-1 font-mono">
              {hint}
            </p>
          </div>
          <div className="mt-2 flex flex-wrap justify-center gap-2">
            <Button 
              size="sm"
              onClick={() => inputRef.current?.click()}
              className="font-mono text-xs"
            >
              <Upload className="h-3.5 w-3.5" /> BROWSE FILE
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => inputRef.current?.click()}
              className="font-mono text-xs"
            >
              <Camera className="h-3.5 w-3.5" /> CAPTURE SENSOR
            </Button>
          </div>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(event) => handleFile(event.target.files?.[0])}
          />
        </div>
      )}
    </div>
  );
}
