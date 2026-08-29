import { PIN_COLORS } from "./GoogleMap";

export default function MapLegend({ lastUpdated, source }) {
  const legendItems = [
    { label: "CRITICAL", colorKey: "Critical", icon: "🔴", color: "#ef4444" },
    { label: "HIGH", colorKey: "High", icon: "🟠", color: "#f97316" },
    { label: "MODERATE", colorKey: "Moderate", icon: "🟡", color: "#eab308" },
    { label: "LOW", colorKey: "Low", icon: "🟢", color: "#22c55e" },
    { label: "MINIMAL", colorKey: "Minimal", icon: "⚪", color: "#94a3b8" },
  ];

  return (
    <div className="mt-3 rounded-xl border border-border bg-card/80 p-4 text-xs backdrop-blur shadow-sm">
      <div className="mb-2 font-semibold text-foreground text-sm border-b border-border pb-1">
        Dengue Risk Level
      </div>
      <div className="flex flex-wrap gap-4 mb-3">
        {legendItems.map(({ label, colorKey, icon, color }) => (
          <div key={colorKey} className="flex items-center gap-1.5">
            <span style={{ fontSize: "14px" }}>{icon}</span>
            <span className="font-medium" style={{ color: color }}>{label}</span>
          </div>
        ))}
      </div>
      
      <div className="text-[11px] text-muted-foreground flex flex-col gap-0.5 border-t border-border pt-2">
        <div><span className="font-semibold">Data Source:</span> {source || 'NDCU'}</div>
        <div>
          <span className="font-semibold">Last Updated:</span>{' '}
          {lastUpdated ? new Date(lastUpdated).toLocaleString('en-GB') : 'Loading...'}
        </div>
      </div>
    </div>
  );
}
