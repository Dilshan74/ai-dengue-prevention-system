import React, { useState, useRef, useEffect } from "react";
import { Scan, Crosshair, Cpu, Maximize2, Image as ImageIcon, CheckCircle2 } from "lucide-react";

/**
 * Locked Utilitarian Status Colors for target breeding classes
 * Anti-AI-Slop: Strict civic palette (Emerald, Amber, Crimson, Cyan)
 */
const CLASS_COLORS = {
  Tire: {
    stroke: "#dc2626", // Crimson - High Risk
    fill: "rgba(220, 38, 38, 0.18)",
    badgeBg: "#450a0a",
    badgeBorder: "#dc2626",
    badgeText: "#fca5a5",
  },
  Tyre: {
    stroke: "#dc2626",
    fill: "rgba(220, 38, 38, 0.18)",
    badgeBg: "#450a0a",
    badgeBorder: "#dc2626",
    badgeText: "#fca5a5",
  },
  "Drain-Inlet": {
    stroke: "#d97706", // Amber - Medium Risk
    fill: "rgba(217, 119, 6, 0.18)",
    badgeBg: "#451a03",
    badgeBorder: "#d97706",
    badgeText: "#fcd34d",
  },
  "Blocked Drain": {
    stroke: "#d97706",
    fill: "rgba(217, 119, 6, 0.18)",
    badgeBg: "#451a03",
    badgeBorder: "#d97706",
    badgeText: "#fcd34d",
  },
  Bottle: {
    stroke: "#0284c7", // Precision Cyan/Blue
    fill: "rgba(2, 132, 199, 0.18)",
    badgeBg: "#082f49",
    badgeBorder: "#0284c7",
    badgeText: "#bae6fd",
  },
  "Plastic-Container": {
    stroke: "#0284c7",
    fill: "rgba(2, 132, 199, 0.18)",
    badgeBg: "#082f49",
    badgeBorder: "#0284c7",
    badgeText: "#bae6fd",
  },
  "Coconut-Exocarp": {
    stroke: "#059669", // Emerald - Bio Organic
    fill: "rgba(5, 150, 105, 0.18)",
    badgeBg: "#022c22",
    badgeBorder: "#059669",
    badgeText: "#a7f3d0",
  },
};

const DEFAULT_COLOR = {
  stroke: "#0f766e", // Deep Teal
  fill: "rgba(15, 118, 110, 0.18)",
  badgeBg: "#042f2e",
  badgeBorder: "#0f766e",
  badgeText: "#99f6e4",
};

export function resolveImageSrc(src) {
  if (!src) return "";
  if (
    src.startsWith("blob:") ||
    src.startsWith("data:") ||
    src.startsWith("http://") ||
    src.startsWith("https://")
  ) {
    return src;
  }
  if (src.startsWith("/uploads/")) {
    return `http://127.0.0.1:5001${src}`;
  }
  if (src.startsWith("uploads/")) {
    return `http://127.0.0.1:5001/${src}`;
  }
  return `http://127.0.0.1:5001${src.startsWith("/") ? "" : "/"}${src}`;
}

export default function BoundingBoxOverlay({
  imageUrl,
  predictions = [],
  isScanning = false,
  selectedIdx = null,
  onSelectBox,
  className = "",
}) {
  const [naturalDimensions, setNaturalDimensions] = useState({ width: 0, height: 0 });
  const [hoveredIdx, setHoveredIdx] = useState(null);
  const [imgSrc, setImgSrc] = useState(resolveImageSrc(imageUrl));
  const [imgError, setImgError] = useState(false);
  const containerRef = useRef(null);
  const imgRef = useRef(null);

  useEffect(() => {
    setImgSrc(resolveImageSrc(imageUrl));
    setImgError(false);
  }, [imageUrl]);

  const handleImageLoad = (e) => {
    const { naturalWidth, naturalHeight } = e.target;
    setNaturalDimensions({
      width: naturalWidth || 640,
      height: naturalHeight || 480,
    });
    setImgError(false);
  };

  const handleImageError = () => {
    if (imgSrc && !imgSrc.startsWith("http://127.0.0.1:5001")) {
      setImgSrc(`http://127.0.0.1:5001${imageUrl.startsWith("/") ? "" : "/"}${imageUrl}`);
    } else {
      setImgError(true);
    }
  };

  // Normalize predictions list
  const validPredictions = (predictions || []).filter(
    (p) => p && (p.bbox || p.box)
  );

  const activeHover = hoveredIdx !== null ? hoveredIdx : selectedIdx;

  return (
    <div
      ref={containerRef}
      className={`relative w-full overflow-hidden rounded-lg border border-slate-700/80 bg-slate-950 font-sans select-none ${className}`}
    >
      {/* Technical HUD Top Bar */}
      <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900/90 px-3 py-2 text-xs font-mono text-slate-300">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500" />
          </span>
          <span className="font-semibold text-teal-400 tracking-wider">MEDIA INSPECTOR</span>
          <span className="text-slate-500">//</span>
          <span className="text-slate-400">YOLOv8m-Dengue</span>
        </div>

        <div className="flex items-center gap-3 text-[11px] text-slate-400">
          {naturalDimensions.width > 0 && (
            <span className="hidden sm:inline bg-slate-800/70 px-1.5 py-0.5 rounded border border-slate-700/50">
              {naturalDimensions.width} × {naturalDimensions.height} px
            </span>
          )}
          <span className="bg-slate-800/70 px-1.5 py-0.5 rounded border border-slate-700/50 text-teal-300">
            {validPredictions.length} cue{validPredictions.length === 1 ? "" : "s"} detected
          </span>
        </div>
      </div>

      {/* Target Image Viewport */}
      <div className="relative bg-slate-950 flex items-center justify-center min-h-[260px] max-h-[540px]">
        {!imgError && imgSrc ? (
          <img
            ref={imgRef}
            src={imgSrc}
            alt="Inspection Target"
            onLoad={handleImageLoad}
            onError={handleImageError}
            className="block w-full h-auto max-h-[540px] object-contain mx-auto"
          />
        ) : (
          <div className="flex flex-col items-center justify-center p-12 text-center text-slate-400 gap-2 font-mono text-xs">
            <ImageIcon className="h-8 w-8 text-slate-600 animate-pulse" />
            <p className="text-slate-300 font-medium">AWAITING MEDIA STREAM</p>
            <p className="text-slate-500 text-[11px]">Upload an image for automated Computer Vision telemetry</p>
          </div>
        )}

        {/* SVG Bounding Boxes Overlay */}
        {naturalDimensions.width > 0 && validPredictions.length > 0 && (
          <svg
            viewBox={`0 0 ${naturalDimensions.width} ${naturalDimensions.height}`}
            className="absolute inset-0 h-full w-full pointer-events-none"
            preserveAspectRatio="none"
          >
            {validPredictions.map((item, index) => {
              const bbox = item.bbox || item.box || {};
              const xMin = bbox.x_min ?? bbox.xmin ?? 0;
              const yMin = bbox.y_min ?? bbox.ymin ?? 0;
              const xMax = bbox.x_max ?? bbox.xmax ?? 0;
              const yMax = bbox.y_max ?? bbox.ymax ?? 0;

              const width = Math.max(0, xMax - xMin);
              const height = Math.max(0, yMax - yMin);

              const classNameStr = item.class || item.label || "Breeding Site";
              const confVal =
                item.confidence !== undefined
                  ? item.confidence <= 1
                    ? (item.confidence * 100).toFixed(1)
                    : Number(item.confidence).toFixed(1)
                  : (item.conf ?? 0).toString();

              const colorTheme = CLASS_COLORS[classNameStr] || DEFAULT_COLOR;
              const isActive = activeHover === index;

              // Reticle bracket size
              const cornerSize = Math.min(width * 0.2, height * 0.2, 18);

              return (
                <g
                  key={index}
                  className="pointer-events-auto cursor-pointer transition-opacity duration-150"
                  onMouseEnter={() => setHoveredIdx(index)}
                  onMouseLeave={() => setHoveredIdx(null)}
                  onClick={() => onSelectBox && onSelectBox(index)}
                >
                  {/* Translucent Bounding Fill */}
                  <rect
                    x={xMin}
                    y={yMin}
                    width={width}
                    height={height}
                    fill={colorTheme.stroke}
                    fillOpacity={isActive ? 0.32 : 0.12}
                    className="transition-all duration-150"
                  />

                  {/* Primary Perimeter Line */}
                  <rect
                    x={xMin}
                    y={yMin}
                    width={width}
                    height={height}
                    fill="none"
                    stroke={colorTheme.stroke}
                    strokeWidth={isActive ? "2.5" : "1.5"}
                    strokeDasharray={isActive ? "none" : "6 3"}
                  />

                  {/* High-Precision Corner Reticles */}
                  {/* Top-Left */}
                  <path
                    d={`M ${xMin} ${yMin + cornerSize} L ${xMin} ${yMin} L ${xMin + cornerSize} ${yMin}`}
                    fill="none"
                    stroke={colorTheme.stroke}
                    strokeWidth="3.5"
                    strokeLinecap="square"
                  />
                  {/* Top-Right */}
                  <path
                    d={`M ${xMax - cornerSize} ${yMin} L ${xMax} ${yMin} L ${xMax} ${yMin + cornerSize}`}
                    fill="none"
                    stroke={colorTheme.stroke}
                    strokeWidth="3.5"
                    strokeLinecap="square"
                  />
                  {/* Bottom-Left */}
                  <path
                    d={`M ${xMin} ${yMax - cornerSize} L ${xMin} ${yMax} L ${xMin + cornerSize} ${yMax}`}
                    fill="none"
                    stroke={colorTheme.stroke}
                    strokeWidth="3.5"
                    strokeLinecap="square"
                  />
                  {/* Bottom-Right */}
                  <path
                    d={`M ${xMax - cornerSize} ${yMax} L ${xMax} ${yMax} L ${xMax} ${yMax - cornerSize}`}
                    fill="none"
                    stroke={colorTheme.stroke}
                    strokeWidth="3.5"
                    strokeLinecap="square"
                  />

                  {/* Floating Telemetry Tag Badge */}
                  <g transform={`translate(${xMin}, ${Math.max(0, yMin - 22)})`}>
                    <rect
                      x="0"
                      y="0"
                      width={Math.max(120, classNameStr.length * 8.5 + 65)}
                      height="20"
                      rx="2"
                      fill={colorTheme.badgeBg}
                      stroke={colorTheme.badgeBorder}
                      strokeWidth="1.2"
                    />
                    <circle cx="8" cy="10" r="3" fill={colorTheme.stroke} />
                    <text
                      x="16"
                      y="14"
                      fill={colorTheme.badgeText}
                      fontSize="11"
                      fontFamily="JetBrains Mono, ui-monospace, monospace"
                      fontWeight="600"
                    >
                      {classNameStr} {confVal}%
                    </text>
                  </g>
                </g>
              );
            })}
          </svg>
        )}

        {/* Precision Laser Scanning Feedback */}
        {isScanning && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {/* Horizontal Laser Line */}
            <div className="absolute left-0 right-0 h-0.5 bg-teal-400 shadow-[0_0_12px_#14b8a6] animate-laser" />
            
            {/* Subtle Scanning Mesh */}
            <div className="absolute inset-0 bg-teal-950/20 backdrop-blur-[0.5px]" />

            {/* Central Telemetry HUD Badge */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 rounded border border-teal-500/50 bg-slate-900/95 px-3 py-1.5 font-mono text-xs font-medium text-teal-300 shadow-md">
              <Scan className="h-3.5 w-3.5 animate-spin text-teal-400" />
              <span>RUNNING INFERENCE // DETECTING TARGET CUES...</span>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Technical Telemetry Footer (Hover/Active inspector readout) */}
      <div className="border-t border-slate-800 bg-slate-900/90 px-3 py-2 text-[11px] font-mono text-slate-400 flex flex-wrap items-center justify-between gap-2">
        {activeHover !== null && validPredictions[activeHover] ? (
          (() => {
            const p = validPredictions[activeHover];
            const bbox = p.bbox || p.box || {};
            const xMin = Math.round(bbox.x_min ?? bbox.xmin ?? 0);
            const yMin = Math.round(bbox.y_min ?? bbox.ymin ?? 0);
            const xMax = Math.round(bbox.x_max ?? bbox.xmax ?? 0);
            const yMax = Math.round(bbox.y_max ?? bbox.ymax ?? 0);
            const w = Math.max(0, xMax - xMin);
            const h = Math.max(0, yMax - yMin);
            const label = p.class || p.label || "Breeding Site";
            const conf = p.confidence !== undefined 
              ? (p.confidence <= 1 ? (p.confidence * 100).toFixed(1) : Number(p.confidence).toFixed(1))
              : p.conf;

            return (
              <div className="flex items-center gap-3 text-teal-300">
                <span className="font-semibold text-slate-200">ACTIVE TARGET [{activeHover + 1}]:</span>
                <span className="bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700 text-slate-100">{label}</span>
                <span>CONF: <strong className="text-teal-400">{conf}%</strong></span>
                <span className="text-slate-400">BBOX: [x:{xMin}, y:{yMin}, w:{w}, h:{h}]</span>
              </div>
            );
          })()
        ) : (
          <div className="flex items-center gap-2 text-slate-500">
            <Crosshair className="h-3 w-3 text-slate-400" />
            <span>Hover or click detection bounding boxes to inspect exact pixel coordinates</span>
          </div>
        )}

        <div className="text-[10px] text-slate-500 ml-auto flex items-center gap-2">
          <span>SRC: 640×640 PYRAMID</span>
          <span>•</span>
          <span>IOU: 0.45</span>
        </div>
      </div>

      {/* Pure CSS Laser Sweep */}
      <style>{`
        @keyframes laserSweep {
          0% { top: 0%; opacity: 0.9; }
          50% { top: 97%; opacity: 1; }
          100% { top: 0%; opacity: 0.9; }
        }
        .animate-laser {
          animation: laserSweep 2s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }
      `}</style>
    </div>
  );
}
