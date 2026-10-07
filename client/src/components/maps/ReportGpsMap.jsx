import { useEffect, useMemo, useState } from "react";
import { ExternalLink, MapPin } from "lucide-react";
import GoogleMap, { PIN_COLORS } from "./GoogleMap";
import mapService from "../../services/mapService";

const REFRESH_INTERVAL = 30000;

function hasCoordinates(report) {
  return (
    report.lat !== null &&
    report.lat !== undefined &&
    report.lat !== "" &&
    report.lng !== null &&
    report.lng !== undefined &&
    report.lng !== "" &&
    Number.isFinite(Number(report.lat)) &&
    Number.isFinite(Number(report.lng)) &&
    Number(report.lat) >= -90 &&
    Number(report.lat) <= 90 &&
    Number(report.lng) >= -180 &&
    Number(report.lng) <= 180
  );
}

export default function ReportGpsMap() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    const loadReports = async () => {
      try {
        const data = await mapService.reports();
        if (!Array.isArray(data)) {
          throw new Error("The GPS reports response was invalid.");
        }
        if (active) {
          setReports(data.filter(hasCoordinates));
          setError("");
        }
      } catch (loadError) {
        console.error("Failed to load GPS report locations:", loadError);
        if (active) {
          setError("GPS report locations could not be loaded. Please try again.");
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    loadReports();
    const intervalId = setInterval(loadReports, REFRESH_INTERVAL);

    return () => {
      active = false;
      clearInterval(intervalId);
    };
  }, []);

  const markers = useMemo(
    () =>
      reports.map((report) => ({
        id: report.id,
        lat: Number(report.lat),
        lng: Number(report.lng),
        colorKey: report.risk,
        title: `${report.id} · ${report.location}`,
        data: report,
      })),
    [reports],
  );

  const center = useMemo(() => {
    if (!markers.length) return undefined;
    return {
      lat: markers.reduce((sum, marker) => sum + marker.lat, 0) / markers.length,
      lng: markers.reduce((sum, marker) => sum + marker.lng, 0) / markers.length,
    };
  }, [markers]);

  const renderReportDetails = (marker) => (
    <div className="min-w-48 space-y-1 text-sm">
      <strong>{marker.data.id}</strong>
      <p>{marker.data.location}</p>
      <p>{marker.data.risk} risk · {marker.data.status}</p>
      <p className="font-mono text-xs">
        {marker.lat.toFixed(6)}, {marker.lng.toFixed(6)}
      </p>
    </div>
  );

  return (
    <div className="space-y-3">
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}

      <GoogleMap
        center={center}
        zoom={markers.length ? 10 : 8}
        markers={markers}
        renderInfoWindow={renderReportDetails}
        className="h-[360px] min-h-[360px]"
      />

      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">
          {loading
            ? "Loading GPS reports…"
            : `${reports.length} report${reports.length === 1 ? "" : "s"} with GPS`}
        </span>
        <span className="text-xs text-muted-foreground">
          Refreshes every 30 seconds
        </span>
      </div>

      {reports.length > 0 && (
        <ul className="max-h-48 space-y-2 overflow-y-auto">
          {reports.slice(0, 10).map((report) => {
            const lat = Number(report.lat);
            const lng = Number(report.lng);
            const mapLink = `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=18/${lat}/${lng}`;
            const color = PIN_COLORS[report.risk] || PIN_COLORS.default;

            return (
              <li
                key={report.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-border p-2 text-sm"
              >
                <div className="flex min-w-0 items-center gap-2">
                  <MapPin
                    className="h-4 w-4 shrink-0"
                    style={{ color: color.background }}
                  />
                  <div className="min-w-0">
                    <div className="truncate font-medium">
                      {report.id} · {report.location}
                    </div>
                    <div className="font-mono text-xs text-muted-foreground">
                      {lat.toFixed(6)}, {lng.toFixed(6)}
                    </div>
                  </div>
                </div>
                <a
                  href={mapLink}
                  target="_blank"
                  rel="noreferrer"
                  className="shrink-0 text-primary hover:underline"
                  aria-label={`Open GPS location for report ${report.id}`}
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              </li>
            );
          })}
        </ul>
      )}

      {!loading && !error && reports.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No reports have GPS coordinates yet. New reports appear here after a
          citizen selects or detects a location.
        </p>
      )}
    </div>
  );
}
