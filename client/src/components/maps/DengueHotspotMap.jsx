import { useEffect, useMemo, useState } from "react";
import { MapPin } from "lucide-react";
import GoogleMap, { PIN_COLORS } from "./GoogleMap";
import MapLegend from "./MapLegend";
import Loader from "../common/Loader";
import EmptyState from "../common/EmptyState";
import mapService from "../../services/mapService";
import { cn } from "../../utils/helpers";

/**
 * Dengue Risk map populated from NDCU data.
 */
export default function DengueHotspotMap({
  compact = false,
  className,
  onDataLoaded,
}) {
  const [riskData, setRiskData] = useState([]);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
        // Do not erase existing valid data if fetch fails
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
    
    // Initial fetch
    fetchData(cancelled);

    // Refresh every 5 minutes (300,000 ms)
    const intervalId = setInterval(() => {
      fetchData(cancelled);
    }, 300000);

    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* Map the risk data objects to the shape expected by <GoogleMap>. */
  const markers = useMemo(
    () =>
      riskData
        .filter((r) => r.latitude != null && r.longitude != null)
        .map((r) => {
          // Map backend risk levels to PIN_COLORS keys
          const riskKey = r.riskLevel === 'CRITICAL' ? 'Critical' : 
                          r.riskLevel === 'HIGH' ? 'High' : 
                          r.riskLevel === 'MODERATE' ? 'Moderate' : 
                          r.riskLevel === 'LOW' ? 'Low' : 'Minimal';
          return {
            id: r._id || `${r.locationName}-${r.district}`,
            lat: r.latitude,
            lng: r.longitude,
            colorKey: riskKey,
            title: r.locationName,
            data: r,
          };
        }),
    [riskData],
  );

  /* Auto-centre the map if we have markers. */
  const center = useMemo(() => {
    if (!markers.length) return undefined; // use default (Sri Lanka)
    const avgLat = markers.reduce((sum, m) => sum + m.lat, 0) / markers.length;
    const avgLng = markers.reduce((sum, m) => sum + m.lng, 0) / markers.length;
    return { lat: avgLat, lng: avgLng };
  }, [markers]);

  /* Render Info Window content for a selected marker. */
  const renderInfoWindow = (marker) => {
    const r = marker.data;
    if (!r) return null;

    const formattedReportDate = r.reportDate ? new Date(r.reportDate).toLocaleDateString("en-GB", { day: 'numeric', month: 'short', year: 'numeric' }) : 'Unknown';
    const formattedLastUpdated = r.lastUpdated ? new Date(r.lastUpdated).toLocaleDateString("en-GB", { day: 'numeric', month: 'short', year: 'numeric' }) : 'Unknown';

    return (
      <div className="map-info-window" style={{ minWidth: 220 }}>
        <h4 style={{ margin: "0 0 6px", fontSize: 15, fontWeight: 600 }}>
          Dengue Risk
        </h4>
        <table style={{ fontSize: 12, lineHeight: 1.5, borderCollapse: "collapse", width: '100%' }}>
          <tbody>
            <tr>
              <td style={{ fontWeight: 500, paddingRight: 10, color: "#64748b" }}>Location</td>
              <td>{r.locationName}</td>
            </tr>
            <tr>
              <td style={{ fontWeight: 500, paddingRight: 10, color: "#64748b" }}>District</td>
              <td>{r.district || r.locationName}</td>
            </tr>
            <tr><td colSpan="2"><hr style={{ margin: '4px 0', borderColor: '#e2e8f0' }}/></td></tr>
            <tr>
              <td style={{ fontWeight: 500, paddingRight: 10, color: "#64748b" }}>Current Cases</td>
              <td style={{ fontWeight: 600 }}>{r.currentCases ?? 'N/A'}</td>
            </tr>
            <tr>
              <td style={{ fontWeight: 500, paddingRight: 10, color: "#64748b" }}>Previous Cases</td>
              <td>{r.previousCases ?? 'N/A'}</td>
            </tr>
            <tr>
              <td style={{ fontWeight: 500, paddingRight: 10, color: "#64748b" }}>Trend</td>
              <td style={{ 
                color: r.trend === 'INCREASING' ? '#ef4444' : r.trend === 'DECREASING' ? '#22c55e' : '#64748b',
                fontWeight: 600 
              }}>
                {r.trend === 'INCREASING' ? 'Increasing ↑' : r.trend === 'DECREASING' ? 'Decreasing ↓' : 'Stable -'}
              </td>
            </tr>
            <tr><td colSpan="2"><hr style={{ margin: '4px 0', borderColor: '#e2e8f0' }}/></td></tr>
            <tr>
              <td style={{ fontWeight: 500, paddingRight: 10, color: "#64748b" }}>Calculated Risk</td>
              <td>
                <span
                  style={{
                    display: "inline-block",
                    padding: "1px 8px",
                    borderRadius: 9999,
                    fontSize: 11,
                    fontWeight: 600,
                    color: "#fff",
                    background:
                      r.riskLevel === "CRITICAL" ? "#ef4444" :
                      r.riskLevel === "HIGH" ? "#f97316" :
                      r.riskLevel === "MODERATE" ? "#eab308" : 
                      r.riskLevel === "LOW" ? "#22c55e" : "#94a3b8",
                  }}
                >
                  {r.riskLevel} ({r.riskScore}%)
                </span>
              </td>
            </tr>
            {r.officialRisk && r.officialRisk !== 'NONE' && (
              <tr>
                <td style={{ fontWeight: 500, paddingRight: 10, color: "#64748b" }}>Official NDCU Risk</td>
                <td style={{ fontWeight: 600, color: '#dc2626' }}>{r.officialRisk}</td>
              </tr>
            )}
            <tr><td colSpan="2"><hr style={{ margin: '4px 0', borderColor: '#e2e8f0' }}/></td></tr>
            <tr>
              <td style={{ fontWeight: 500, paddingRight: 10, color: "#64748b" }}>Source</td>
              <td>{r.source || 'NDCU'}</td>
            </tr>
            <tr>
              <td style={{ fontWeight: 500, paddingRight: 10, color: "#64748b" }}>Report Date</td>
              <td>{formattedReportDate}</td>
            </tr>
            <tr>
              <td style={{ fontWeight: 500, paddingRight: 10, color: "#64748b" }}>Last Updated</td>
              <td>{formattedLastUpdated}</td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  };

  /* --- Render ----------------------------------------------------------- */

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

  return (
    <div className={cn("space-y-0", className)}>
      {riskData.length === 0 ? (
        <EmptyState
          icon={MapPin}
          title="No dengue risk data available"
          description="Awaiting synchronization with NDCU public reports."
        />
      ) : (
        <GoogleMap
          center={center}
          zoom={markers.length === 1 ? 14 : 7} // Zoom out slightly for district level
          markers={markers}
          renderInfoWindow={renderInfoWindow}
          className={compact ? "h-72" : "h-[520px]"}
        />
      )}

      {/* Dynamic Map Legend replacing the static legend */}
      <MapLegend lastUpdated={lastUpdated} source="NDCU" />

      {/* Districts Grouped by Risk Level */}
      {riskData.length > 0 && (
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {['CRITICAL', 'HIGH', 'MODERATE', 'LOW', 'MINIMAL'].map((level) => {
            const districtsInLevel = riskData.filter((r) => r.riskLevel === level);
            if (districtsInLevel.length === 0) return null;
            
            const colorMap = {
              CRITICAL: { bg: 'bg-red-100/50', text: 'text-red-700', border: 'border-red-200' },
              HIGH: { bg: 'bg-orange-100/50', text: 'text-orange-700', border: 'border-orange-200' },
              MODERATE: { bg: 'bg-yellow-100/50', text: 'text-yellow-700', border: 'border-yellow-200' },
              LOW: { bg: 'bg-green-100/50', text: 'text-green-700', border: 'border-green-200' },
              MINIMAL: { bg: 'bg-slate-100/50', text: 'text-slate-700', border: 'border-slate-200' }
            };
            const styles = colorMap[level];

            return (
              <div key={level} className={cn("rounded-lg border p-3 backdrop-blur-sm", styles.bg, styles.border)}>
                <h5 className={cn("font-semibold mb-2 text-sm", styles.text)}>{level} RISK</h5>
                <ul className="text-xs space-y-1">
                  {districtsInLevel.map(d => (
                    <li key={d._id || d.locationName} className="flex justify-between items-center text-muted-foreground">
                      <span>{d.locationName}</span>
                      <span className={cn("font-medium", styles.text)}>{d.riskScore}%</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
