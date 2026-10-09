import { useEffect, useMemo, useState } from "react";
import { MapPin, Search, RefreshCw, XCircle } from "lucide-react";
import GoogleMap, { PIN_COLORS } from "./GoogleMap";
import MapLegend from "./MapLegend";
import Loader from "../common/Loader";
import EmptyState from "../common/EmptyState";
import mapService from "../../services/mapService";
import { cn } from "../../utils/helpers";

/**
 * Dengue Risk map populated from NDCU data with live filtering,
 * search sync, interactive markers, and district grouping.
 */
export default function DengueHotspotMap({
  compact = false,
  className,
  onDataLoaded,
  searchQuery = "",
  selectedRisk = "all",
  onClearFilters,
}) {
  const [riskData, setRiskData] = useState([]);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeDistrictId, setActiveDistrictId] = useState(null);

  const fetchData = async (cancelled = false) => {
    try {
      const response = await mapService.dengueRisk();
      if (!cancelled && response?.success) {
        const data = response.data || [];
        setRiskData(data);
        setLastUpdated(response.lastUpdated);
        if (onDataLoaded) onDataLoaded(data);
        setError(null);
      }
    } catch (err) {
      if (!cancelled) {
        console.error("Failed to fetch dengue risk data:", err);
        if (riskData.length === 0) {
          setError("Unable to load dengue risk locations. Please try again.");
        }
      }
    } finally {
      if (!cancelled) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    let cancelled = false;
    fetchData(cancelled);

    const intervalId = setInterval(() => {
      fetchData(cancelled);
    }, 300000);

    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, []);

  /**
   * Filter risk data based on searchQuery and selectedRisk level.
   */
  const filteredData = useMemo(() => {
    const q = (searchQuery || "").trim().toLowerCase();
    const rFilter = (selectedRisk || "all").toUpperCase();

    return riskData.filter((r) => {
      const name = (r.locationName || "").toLowerCase();
      const district = (r.district || "").toLowerCase();
      const matchesSearch = !q || name.includes(q) || district.includes(q);

      // Support both CRITICAL, HIGH, MODERATE, LOW, MINIMAL
      const level = (r.riskLevel || "").toUpperCase();
      let matchesRisk = true;
      if (rFilter !== "ALL") {
        if (rFilter === "HIGH") {
          matchesRisk = level === "HIGH" || level === "CRITICAL";
        } else if (rFilter === "MEDIUM" || rFilter === "MODERATE") {
          matchesRisk = level === "MODERATE" || level === "MEDIUM";
        } else {
          matchesRisk = level === rFilter;
        }
      }

      return matchesSearch && matchesRisk;
    });
  }, [riskData, searchQuery, selectedRisk]);

  /** Map filtered risk data objects to marker format. */
  const markers = useMemo(() => {
    return filteredData
      .filter((r) => r.latitude != null && r.longitude != null)
      .map((r) => {
        const riskKey =
          r.riskLevel === "CRITICAL"
            ? "Critical"
            : r.riskLevel === "HIGH"
            ? "High"
            : r.riskLevel === "MODERATE"
            ? "Moderate"
            : r.riskLevel === "LOW"
            ? "Low"
            : "Minimal";

        return {
          id: r._id || `${r.locationName}-${r.district}`,
          lat: r.latitude,
          lng: r.longitude,
          colorKey: riskKey,
          title: r.locationName,
          data: r,
        };
      });
  }, [filteredData]);

  /** Calculate map center based on filtered markers. */
  const center = useMemo(() => {
    if (!markers.length) return undefined;
    const avgLat = markers.reduce((sum, m) => sum + m.lat, 0) / markers.length;
    const avgLng = markers.reduce((sum, m) => sum + m.lng, 0) / markers.length;
    return { lat: avgLat, lng: avgLng };
  }, [markers]);

  const latestSourceRecord = riskData.reduce((latest, current) => {
    if (!current.reportUrl) return latest;
    if (!latest || new Date(current.lastUpdated) > new Date(latest.lastUpdated)) return current;
    return latest;
  }, null);

  const handleSelectDistrict = (item) => {
    setActiveDistrictId(item._id || item.locationName);
  };

  if (loading && riskData.length === 0) return <Loader label="Loading dengue risk data…" />;

  if (error && riskData.length === 0) {
    return (
      <EmptyState
        icon={MapPin}
        title="Unable to load dengue risk map"
        description={error}
      />
    );
  }

  const hasActiveFilters = Boolean(searchQuery.trim() || (selectedRisk && selectedRisk !== "all"));

  return (
    <div className={cn("space-y-4", className)}>
      {/* Active Filter Status Bar */}
      {hasActiveFilters && (
        <div className="flex items-center justify-between rounded-xl border border-primary/20 bg-primary/5 px-4 py-2 text-xs">
          <span className="text-foreground">
            Showing <strong>{filteredData.length}</strong> of {riskData.length} districts
            {searchQuery && <> matching &quot;<strong>{searchQuery}</strong>&quot;</>}
            {selectedRisk !== "all" && <> with risk: <strong>{selectedRisk}</strong></>}
          </span>
          {onClearFilters && (
            <button
              onClick={onClearFilters}
              className="inline-flex items-center gap-1 font-semibold text-primary hover:underline cursor-pointer"
            >
              <RefreshCw className="h-3 w-3" /> Reset Filters
            </button>
          )}
        </div>
      )}

      {/* Main Map */}
      <GoogleMap
        center={center}
        zoom={markers.length === 1 ? 12 : 8}
        markers={markers}
        className={compact ? "h-72" : "h-[500px]"}
      />

      {/* Map Legend */}
      <MapLegend
        lastUpdated={lastUpdated}
        source={riskData.find((record) => record.source)?.source || "NDCU"}
        sourceUrl={latestSourceRecord?.reportUrl}
      />

      {/* Filtered Districts Grouped by Risk Level */}
      {filteredData.length > 0 ? (
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {["CRITICAL", "HIGH", "MODERATE", "LOW", "MINIMAL"].map((level) => {
            const districtsInLevel = filteredData.filter((r) => r.riskLevel === level);
            if (districtsInLevel.length === 0) return null;

            const colorMap = {
              CRITICAL: {
                bg: "bg-red-500/10 border-red-500/25",
                text: "text-red-700 dark:text-red-400",
                badge: "bg-red-500 text-white",
              },
              HIGH: {
                bg: "bg-orange-500/10 border-orange-500/25",
                text: "text-orange-700 dark:text-orange-400",
                badge: "bg-orange-500 text-white",
              },
              MODERATE: {
                bg: "bg-yellow-500/10 border-yellow-500/25",
                text: "text-yellow-700 dark:text-yellow-400",
                badge: "bg-yellow-500 text-white",
              },
              LOW: {
                bg: "bg-green-500/10 border-green-500/25",
                text: "text-green-700 dark:text-green-400",
                badge: "bg-green-500 text-white",
              },
              MINIMAL: {
                bg: "bg-slate-500/10 border-slate-500/25",
                text: "text-slate-700 dark:text-slate-400",
                badge: "bg-slate-500 text-white",
              },
            };
            const styles = colorMap[level] || colorMap.MODERATE;

            return (
              <div
                key={level}
                className={cn("rounded-2xl border p-4 backdrop-blur-sm shadow-xs transition-all", styles.bg)}
              >
                <div className="flex items-center justify-between mb-3 border-b border-border/40 pb-2">
                  <h5 className={cn("font-bold text-xs uppercase tracking-wider", styles.text)}>
                    {level} RISK ({districtsInLevel.length})
                  </h5>
                  <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold", styles.badge)}>
                    {level === "CRITICAL"
                      ? "81–100%"
                      : level === "HIGH"
                      ? "61–80%"
                      : level === "MODERATE"
                      ? "41–60%"
                      : "21–40%"}
                  </span>
                </div>

                <ul className="text-xs space-y-1.5">
                  {districtsInLevel.map((d) => (
                    <li
                      key={d._id || d.locationName}
                      onClick={() => handleSelectDistrict(d)}
                      className={cn(
                        "flex justify-between items-center p-1.5 rounded-lg transition-colors cursor-pointer hover:bg-black/5 dark:hover:bg-white/5",
                        activeDistrictId === (d._id || d.locationName) && "ring-1 ring-primary bg-primary/10"
                      )}
                    >
                      <span className="font-medium text-foreground flex items-center gap-1.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-current"></span>
                        {d.locationName}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-muted-foreground font-mono">
                          {d.currentCases ?? 0} cases
                        </span>
                        <span className={cn("font-bold text-xs", styles.text)}>
                          {d.riskScore}%
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center mt-4">
          <XCircle className="mx-auto h-8 w-8 text-muted-foreground/60 mb-2" />
          <h4 className="font-bold text-sm text-foreground">No matching districts found</h4>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
            No locations matched your search &quot;{searchQuery}&quot; with risk filter &quot;{selectedRisk}&quot;.
          </p>
          {onClearFilters && (
            <button
              onClick={onClearFilters}
              className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline cursor-pointer"
            >
              <RefreshCw className="h-3.5 w-3.5" /> Clear Search &amp; Show All Districts
            </button>
          )}
        </div>
      )}
    </div>
  );
}
