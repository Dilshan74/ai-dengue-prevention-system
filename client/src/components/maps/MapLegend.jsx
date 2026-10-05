export default function MapLegend({ lastUpdated, source, sourceUrl }) {
  const legendItems = [
    { label: "CRITICAL", range: "81–100", colorKey: "Critical", color: "#ef4444", meaning: "Highest calculated risk score" },
    { label: "HIGH", range: "61–80", colorKey: "High", color: "#f97316", meaning: "Elevated calculated risk score" },
    { label: "MODERATE", range: "41–60", colorKey: "Moderate", color: "#eab308", meaning: "Mid-range calculated risk score" },
    { label: "LOW", range: "21–40", colorKey: "Low", color: "#22c55e", meaning: "Lower calculated risk score" },
    { label: "MINIMAL", range: "0–20", colorKey: "Minimal", color: "#94a3b8", meaning: "Lowest calculated risk score" },
  ];
  const updatedDate = lastUpdated ? new Date(lastUpdated) : null;
  const formattedLastUpdated =
    updatedDate && !Number.isNaN(updatedDate.getTime())
      ? updatedDate.toLocaleString("en-GB")
      : "Unavailable";

  return (
    <section
      aria-labelledby="risk-legend-title"
      className="mt-3 rounded-xl border border-border bg-card/80 p-4 text-xs backdrop-blur shadow-sm"
    >
      <div
        id="risk-legend-title"
        className="mb-2 border-b border-border pb-1 text-sm font-semibold text-foreground"
      >
        Risk levels and what they mean
      </div>
      <p className="mb-3 text-muted-foreground">
        Scores are calculated from reported case counts and their change from the previous report.
        They are area-level indicators, not individual health assessments.
      </p>
      <div className="mb-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {legendItems.map(({ label, range, colorKey, color, meaning }) => (
          <div key={colorKey} className="flex items-start gap-2 rounded-lg border border-border/60 p-2">
            <span
              aria-hidden="true"
              className="mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: color }}
            />
            <div>
              <p className="font-semibold" style={{ color }}>
                {label} <span className="font-normal text-muted-foreground">({range})</span>
              </p>
              <p className="text-muted-foreground">{meaning}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-1 border-t border-border pt-2 text-[11px] text-muted-foreground">
        <p>
          <span className="font-semibold">Data source:</span>{" "}
          {sourceUrl ? (
            <a
              href={sourceUrl}
              target="_blank"
              rel="noreferrer"
              className="font-medium text-primary underline underline-offset-2"
            >
              {source || "Official dengue report"} (opens in a new tab)
            </a>
          ) : (
            source || "Official dengue report"
          )}
        </p>
        <p>
          <span className="font-semibold">Data last updated:</span> {formattedLastUpdated}
        </p>
      </div>
    </section>
  );
}
