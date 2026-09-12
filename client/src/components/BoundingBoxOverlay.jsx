import React, { useState, useRef, useEffect } from "react";
import { Sparkles, Scan, AlertTriangle } from "lucide-react";

/**
 * Color configuration per target breeding class
 */
const CLASS_COLORS = {
  Tire: {
    stroke: "#ef4444", // Red
    fill: "rgba(239, 68, 68, 0.15)",
    badge: "bg-red-500/90 text-white",
    border: "border-red-500",
  },
  Tyre: {
    stroke: "#ef4444",
    fill: "rgba(239, 68, 68, 0.15)",
    badge: "bg-red-500/90 text-white",
    border: "border-red-500",
  },
  "Drain-Inlet": {
    stroke: "#f59e0b", // Amber
    fill: "rgba(245, 158, 11, 0.15)",
    badge: "bg-amber-500/90 text-white",
    border: "border-amber-500",
  },
  Bottle: {
    stroke: "#3b82f6", // Blue
    fill: "rgba(59, 130, 246, 0.15)",
    badge: "bg-blue-500/90 text-white",
    border: "border-blue-500",
  },
  "Coconut-Exocarp": {
    stroke: "#10b981", // Emerald
    fill: "rgba(16, 185, 129, 0.15)",
    badge: "bg-emerald-500/90 text-white",
    border: "border-emerald-500",
  },
  Vase: {
    stroke: "#8b5cf6", // Violet
    fill: "rgba(139, 92, 246, 0.15)",
    badge: "bg-violet-500/90 text-white",
    border: "border-violet-500",
  },
};

const DEFAULT_COLOR = {
  stroke: "#06b6d4", // Cyan
  fill: "rgba(6, 182, 212, 0.15)",
  badge: "bg-cyan-500/90 text-white",
  border: "border-cyan-500",
};

export default function BoundingBoxOverlay({
  imageUrl,
  predictions = [],
  isScanning = false,
  className = "",
}) {
  const [naturalDimensions, setNaturalDimensions] = useState({ width: 0, height: 0 });
  const [hoveredIdx, setHoveredIdx] = useState(null);
  const containerRef = useRef(null);
  const imgRef = useRef(null);

  const handleImageLoad = (e) => {
    const { naturalWidth, naturalHeight } = e.target;
    setNaturalDimensions({
      width: naturalWidth || 640,
      height: naturalHeight || 480,
    });
  };

  // Normalize predictions list
  const validPredictions = (predictions || []).filter(
    (p) => p && (p.bbox || p.box)
  );

  return (
    <div
      ref={containerRef}
      className={`relative inline-block w-full overflow-hidden rounded-2xl bg-slate-950/40 select-none ${className}`}
    >
      {/* Target Image */}
      <img
        ref={imgRef}
        src={imageUrl}
        alt="Suspected mosquito breeding site"
        onLoad={handleImageLoad}
        className="block w-full h-auto max-h-[520px] object-contain mx-auto rounded-2xl transition-all duration-300"
      />

      {/* SVG Bounding Boxes Overlay */}
      {naturalDimensions.width > 0 && validPredictions.length > 0 && (
        <svg
          viewBox={`0 0 ${naturalDimensions.width} ${naturalDimensions.height}`}
          className="absolute inset-0 h-full w-full pointer-events-none"
          preserveAspectRatio="none"
        >
          <defs>
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

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
                  ? Math.round(item.confidence * 100)
                  : Math.round(item.confidence)
                : item.conf ?? 0;

            const colorTheme = CLASS_COLORS[classNameStr] || DEFAULT_COLOR;
            const isHovered = hoveredIdx === index;

            // Corner crosshair lengths
            const cornerSize = Math.min(width * 0.15, height * 0.15, 20);

            return (
              <g
                key={index}
                className="pointer-events-auto cursor-pointer transition-all duration-200"
                onMouseEnter={() => setHoveredIdx(index)}
                onMouseLeave={() => setHoveredIdx(null)}
              >
                {/* Translucent Fill */}
                <rect
                  x={xMin}
                  y={yMin}
                  width={width}
                  height={height}
                  fill={isHovered ? colorTheme.stroke : colorTheme.fill}
                  fillOpacity={isHovered ? 0.35 : 0.15}
                  rx="6"
                  className="transition-all duration-200"
                />

                {/* Primary Border */}
                <rect
                  x={xMin}
                  y={yMin}
                  width={width}
                  height={height}
                  fill="none"
                  stroke={colorTheme.stroke}
                  strokeWidth={isHovered ? "4" : "2.5"}
                  strokeDasharray={isHovered ? "none" : "8 4"}
                  filter={isHovered ? "url(#glow)" : undefined}
                  rx="6"
                  className="transition-all duration-200"
                />

                {/* Corner Tech Accents */}
                {/* Top-Left Corner */}
                <path
                  d={`M ${xMin} ${yMin + cornerSize} L ${xMin} ${yMin} L ${xMin + cornerSize} ${yMin}`}
                  fill="none"
                  stroke={colorTheme.stroke}
                  strokeWidth="4"
                  strokeLinecap="round"
                />
                {/* Top-Right Corner */}
                <path
                  d={`M ${xMax - cornerSize} ${yMin} L ${xMax} ${yMin} L ${xMax} ${yMin + cornerSize}`}
                  fill="none"
                  stroke={colorTheme.stroke}
                  strokeWidth="4"
                  strokeLinecap="round"
                />
                {/* Bottom-Left Corner */}
                <path
                  d={`M ${xMin} ${yMax - cornerSize} L ${xMin} ${yMax} L ${xMin + cornerSize} ${yMax}`}
                  fill="none"
                  stroke={colorTheme.stroke}
                  strokeWidth="4"
                  strokeLinecap="round"
                />
                {/* Bottom-Right Corner */}
                <path
                  d={`M ${xMax - cornerSize} ${yMax} L ${xMax} ${yMax} L ${xMax} ${yMax - cornerSize}`}
                  fill="none"
                  stroke={colorTheme.stroke}
                  strokeWidth="4"
                  strokeLinecap="round"
                />

                {/* Floating Tag Badge inside SVG */}
                <g transform={`translate(${xMin}, ${Math.max(0, yMin - 28)})`}>
                  <rect
                    x="0"
                    y="0"
                    width={Math.max(110, classNameStr.length * 10 + 45)}
                    height="24"
                    rx="4"
                    fill="#0f172a"
                    fillOpacity="0.92"
                    stroke={colorTheme.stroke}
                    strokeWidth="1.5"
                  />
                  <circle cx="10" cy="12" r="4" fill={colorTheme.stroke} />
                  <text
                    x="20"
                    y="16"
                    fill="#ffffff"
                    fontSize="12"
                    fontFamily="Inter, ui-sans-serif, system-ui, sans-serif"
                    fontWeight="600"
                    letterSpacing="0.02em"
                  >
                    {classNameStr} {confVal}%
                  </text>
                </g>
              </g>
            );
          })}
        </svg>
      )}

      {/* High-Tech Scanning Laser Animation */}
      {isScanning && (
        <div className="absolute inset-0 pointer-events-none flex flex-col justify-between overflow-hidden">
          {/* Moving Laser Beam */}
          <div className="laser-scanner absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_18px_#22d3ee] animate-laser" />
          
          {/* Scan Grid Tint */}
          <div className="absolute inset-0 bg-cyan-500/10 backdrop-blur-[1px]" />

          {/* Status Chip */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 rounded-full border border-cyan-400/40 bg-slate-900/90 px-4 py-1.5 text-xs font-semibold text-cyan-300 shadow-xl backdrop-blur-md">
            <Scan className="h-4 w-4 animate-spin text-cyan-400" />
            <span>YOLOv8 Scanning: Detecting water accumulation cues...</span>
          </div>

          {/* Crosshair Overlay */}
          <div className="absolute inset-8 border border-dashed border-cyan-400/25 rounded-xl pointer-events-none flex items-center justify-center">
            <div className="h-6 w-6 border-t-2 border-l-2 border-cyan-400 absolute top-0 left-0" />
            <div className="h-6 w-6 border-t-2 border-r-2 border-cyan-400 absolute top-0 right-0" />
            <div className="h-6 w-6 border-b-2 border-l-2 border-cyan-400 absolute bottom-0 left-0" />
            <div className="h-6 w-6 border-b-2 border-r-2 border-cyan-400 absolute bottom-0 right-0" />
          </div>
        </div>
      )}

      {/* Inline Styles for Laser Animation */}
      <style>{`
        @keyframes laserSweep {
          0% { top: 0%; opacity: 0.8; }
          50% { top: 96%; opacity: 1; }
          100% { top: 0%; opacity: 0.8; }
        }
        .animate-laser {
          animation: laserSweep 2s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }
      `}</style>
    </div>
  );
}
