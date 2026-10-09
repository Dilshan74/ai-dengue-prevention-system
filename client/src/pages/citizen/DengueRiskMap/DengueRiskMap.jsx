import { useState } from "react";
import PageHeader from "../../../components/common/PageHeader";
import SearchBar from "../../../components/common/SearchBar";
import { Select } from "../../../components/common/Field";
import DengueHotspotMap from "../../../components/maps/DengueHotspotMap";
import { ShieldAlert, Compass } from "lucide-react";

const RISK_OPTIONS = [
  { value: "all", label: "All Risk Levels" },
  { value: "CRITICAL", label: "🔴 Critical Risk (81–100%)" },
  { value: "HIGH", label: "🟠 High Risk (61–80%)" },
  { value: "MODERATE", label: "🟡 Moderate Risk (41–60%)" },
  { value: "LOW", label: "🟢 Low Risk (21–40%)" },
];

export default function DengueRiskMap() {
  const [query, setQuery] = useState("");
  const [risk, setRisk] = useState("all");

  const clearFilters = () => {
    setQuery("");
    setRisk("all");
  };

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-2 border-b border-border/60">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-0.5 text-xs font-semibold text-primary mb-1">
            <Compass className="h-3.5 w-3.5" />
            <span>National Surveillance Radar</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-foreground tracking-tight">
            National Dengue Risk Map
          </h1>
          <p className="text-xs md:text-sm text-muted-foreground">
            Live risk zones, active transmission outbreaks, and NDCU district surveillance across Sri Lanka.
          </p>
        </div>

        {/* Quick Help Pill */}
        <div className="hidden sm:flex items-center gap-2 rounded-xl border border-border bg-card px-3.5 py-2 text-xs shadow-2xs">
          <ShieldAlert className="h-4 w-4 text-amber-500" />
          <span className="text-muted-foreground">
            Click any pin on the map to inspect district cases &amp; transmission trend.
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center gap-3">
        <SearchBar
          value={query}
          onChange={setQuery}
          placeholder="Search district e.g. Galle, Kandy, Colombo…"
          className="flex-1 sm:max-w-md"
        />
        <Select
          className="h-10 w-52 text-xs font-medium"
          value={risk}
          onChange={(event) => setRisk(event.target.value)}
          options={RISK_OPTIONS}
        />
      </div>

      {/* Interactive Map with Synchronized Search & Filters */}
      <DengueHotspotMap
        searchQuery={query}
        selectedRisk={risk}
        onClearFilters={clearFilters}
      />
    </div>
  );
}
