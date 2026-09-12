import { useRef, useState } from "react";
import { Camera, ImagePlus, UploadCloud, X } from "lucide-react";
import Button from "../common/Button";
import { cn } from "../../utils/helpers";
import BoundingBoxOverlay from "../BoundingBoxOverlay";

/** Drag-and-drop image picker with interactive BoundingBoxOverlay preview. */
export default function ImageUploader({
  onSelect,
  predictions = [],
  isScanning = false,
  hint = "PNG, JPG up to 10MB",
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
        "relative flex min-h-[280px] flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed p-4 sm:p-6 text-center transition-colors",
        dragOver ? "border-primary bg-primary/5" : "border-border bg-muted/30",
      )}
    >
      {preview ? (
        <div className="w-full flex flex-col items-center gap-3">
          <BoundingBoxOverlay
            imageUrl={preview}
            predictions={predictions}
            isScanning={isScanning}
          />
          <Button
            size="sm"
            variant="secondary"
            onClick={clear}
            disabled={isScanning}
            className="mt-1"
          >
            <X className="h-4 w-4" /> Remove &amp; Choose Another
          </Button>
        </div>
      ) : (
        <>
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-primary">
            <UploadCloud className="h-7 w-7" />
          </div>
          <div>
            <p className="text-sm font-semibold">Drag &amp; drop an image here</p>
            <p className="text-xs text-muted-foreground">{hint}</p>
          </div>
          <div className="mt-2 flex flex-wrap justify-center gap-2">
            <Button onClick={() => inputRef.current?.click()}>
              <ImagePlus className="h-4 w-4" /> Upload from Device
            </Button>
            <Button
              variant="outline"
              onClick={() => inputRef.current?.click()}
            >
              <Camera className="h-4 w-4" /> Camera Capture
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
        </>
      )}
    </div>
  );
}
