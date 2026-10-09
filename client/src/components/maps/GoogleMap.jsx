import { useCallback, useState, useRef, useEffect } from "react";
import {
  Map,
  AdvancedMarker,
  Pin,
  InfoWindow,
} from "@vis.gl/react-google-maps";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { cn } from "../../utils/helpers";

/** Default map centre — Sri Lanka. */
const SRI_LANKA = { lat: 7.8731, lng: 80.7718 };
const DEFAULT_ZOOM = 8;

/**
 * Pin colour presets for risk / status levels.
 * Each value maps to { background, border, glyph } for <Pin>.
 */
export const PIN_COLORS = {
  Critical: { background: "#ef4444", borderColor: "#b91c1c", glyphColor: "#fff" },
  High: { background: "#f97316", borderColor: "#c2410c", glyphColor: "#fff" },
  Moderate: { background: "#eab308", borderColor: "#a16207", glyphColor: "#fff" },
  Low: { background: "#22c55e", borderColor: "#15803d", glyphColor: "#fff" },
  Minimal: { background: "#94a3b8", borderColor: "#64748b", glyphColor: "#fff" },
  Resolved: { background: "#22c55e", borderColor: "#15803d", glyphColor: "#fff" },
  "Inspection Completed": { background: "#22c55e", borderColor: "#15803d", glyphColor: "#fff" },
  Pending: { background: "#eab308", borderColor: "#a16207", glyphColor: "#fff" },
  default: { background: "#0d9488", borderColor: "#0f766e", glyphColor: "#fff" },
};

/**
 * Fallback interactive OpenStreetMap engine using Leaflet.
 * Renders interactive color-coded pins, auto-focus, and popups.
 */
function LeafletMapComponent({
  center = SRI_LANKA,
  zoom = DEFAULT_ZOOM,
  markers = [],
  onMarkerClick,
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersGroupRef = useRef(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      zoomControl: true,
      scrollWheelZoom: true,
    }).setView([center.lat, center.lng], zoom);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: "© OpenStreetMap contributors",
    }).addTo(map);

    const markersGroup = L.layerGroup().addTo(map);
    markersGroupRef.current = markersGroup;
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapInstanceRef.current;
    const group = markersGroupRef.current;
    if (!map || !group) return;

    group.clearLayers();

    if (markers.length === 0) return;

    const leafletMarkers = [];

    markers.forEach((m) => {
      if (m.lat == null || m.lng == null) return;
      const colors = PIN_COLORS[m.colorKey] || PIN_COLORS.default;
      const pinColor = colors.background;

      const customIcon = L.divIcon({
        className: "custom-leaflet-marker",
        html: `
          <div style="
            background: ${pinColor};
            width: 26px;
            height: 26px;
            border-radius: 50%;
            border: 2.5px solid #ffffff;
            box-shadow: 0 0 12px ${pinColor}aa, 0 3px 6px rgba(0,0,0,0.35);
            display: flex;
            align-items: center;
            justify-content: center;
            color: #ffffff;
            font-size: 11px;
            font-weight: bold;
            cursor: pointer;
            transition: transform 0.2s;
          ">
            📍
          </div>
        `,
        iconSize: [26, 26],
        iconAnchor: [13, 13],
        popupAnchor: [0, -16],
      });

      const lm = L.marker([m.lat, m.lng], { icon: customIcon, title: m.title });

      const d = m.data || {};
      const riskBadgeColor =
        d.riskLevel === "CRITICAL"
          ? "#ef4444"
          : d.riskLevel === "HIGH"
          ? "#f97316"
          : d.riskLevel === "MODERATE"
          ? "#eab308"
          : "#22c55e";

      const popupHtml = `
        <div style="font-family: inherit; font-size: 12px; min-width: 200px; color: #0f172a; padding: 2px;">
          <div style="font-weight: 700; font-size: 14px; margin-bottom: 4px; display: flex; justify-content: space-between; align-items: center; gap: 8px;">
            <span>${d.locationName || m.title}</span>
            <span style="background: ${riskBadgeColor}; color: white; padding: 2px 7px; border-radius: 999px; font-size: 10px; font-weight: bold;">
              ${d.riskLevel || m.colorKey}
            </span>
          </div>
          <div style="color: #64748b; font-size: 11px; margin-bottom: 6px;">
            District: <strong>${d.district || d.locationName || "Sri Lanka"}</strong>
          </div>
          <div style="border-top: 1px solid #e2e8f0; padding-top: 6px; display: flex; justify-content: space-between; margin-bottom: 3px;">
            <span style="color: #64748b;">Risk Score:</span>
            <strong style="color: ${riskBadgeColor};">${d.riskScore ?? 90}%</strong>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 3px;">
            <span style="color: #64748b;">Current NDCU Cases:</span>
            <strong>${d.currentCases ?? "N/A"}</strong>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span style="color: #64748b;">Transmission Trend:</span>
            <span style="font-weight: 600; color: ${d.trend === "INCREASING" ? "#ef4444" : "#10b981"};">
              ${d.trend === "INCREASING" ? "Increasing ↑" : d.trend === "DECREASING" ? "Decreasing ↓" : "Stable -"}
            </span>
          </div>
        </div>
      `;

      lm.bindPopup(popupHtml);
      lm.on("click", () => onMarkerClick?.(m));
      lm.addTo(group);
      leafletMarkers.push(lm);
    });

    if (markers.length === 1) {
      map.flyTo([markers[0].lat, markers[0].lng], 12, { duration: 0.8 });
      setTimeout(() => {
        leafletMarkers[0]?.openPopup();
      }, 400);
    } else if (markers.length > 1) {
      const bounds = L.latLngBounds(markers.map((m) => [m.lat, m.lng]));
      map.fitBounds(bounds, { padding: [35, 35], maxZoom: 9 });
    }
  }, [markers]);

  return <div ref={mapContainerRef} className="w-full h-full" style={{ zIndex: 1 }} />;
}

/**
 * Unified Map Component supporting both Google Maps (when API key is present)
 * and interactive OpenStreetMap Leaflet (when offline or no key).
 */
export default function GoogleMap({
  center = SRI_LANKA,
  zoom = DEFAULT_ZOOM,
  markers = [],
  onMarkerClick,
  onMapClick,
  renderInfoWindow,
  className,
  style,
  children,
}) {
  const [selected, setSelected] = useState(null);

  const handleMarkerClick = useCallback(
    (marker) => {
      setSelected(marker);
      onMarkerClick?.(marker);
    },
    [onMarkerClick],
  );

  const handleMapClick = useCallback(
    (e) => {
      setSelected(null);
      if (!onMapClick) return;
      const latLng = e.detail?.latLng;
      if (latLng) onMapClick({ lat: latLng.lat, lng: latLng.lng });
    },
    [onMapClick],
  );

  const hasGoogleKey = Boolean(
    import.meta.env.VITE_GOOGLE_MAPS_API_KEY &&
    import.meta.env.VITE_GOOGLE_MAPS_API_KEY !== "undefined" &&
    import.meta.env.VITE_GOOGLE_MAPS_API_KEY.trim().length > 5
  );

  return (
    <div
      className={cn(
        "map-container relative rounded-2xl overflow-hidden border border-border min-h-[420px] shadow-sm",
        className
      )}
      style={style}
    >
      <div className="absolute inset-0">
        {hasGoogleKey ? (
          <Map
            center={center || SRI_LANKA}
            zoom={zoom || DEFAULT_ZOOM}
            mapId="DEMO_MAP_ID"
            gestureHandling="cooperative"
            disableDefaultUI={false}
            onClick={handleMapClick}
            style={{ width: "100%", height: "100%" }}
          >
            {markers.map((marker) => {
              const colors = PIN_COLORS[marker.colorKey] || PIN_COLORS.default;
              return (
                <AdvancedMarker
                  key={marker.id}
                  position={{ lat: marker.lat, lng: marker.lng }}
                  title={marker.title || marker.id}
                  onClick={() => handleMarkerClick(marker)}
                >
                  <Pin
                    background={colors.background}
                    borderColor={colors.borderColor}
                    glyphColor={colors.glyphColor}
                  />
                </AdvancedMarker>
              );
            })}

            {selected && (
              <InfoWindow
                position={{ lat: selected.lat, lng: selected.lng }}
                onCloseClick={() => setSelected(null)}
                pixelOffset={[0, -40]}
              >
                {renderInfoWindow ? (
                  renderInfoWindow(selected)
                ) : (
                  <div className="map-info-window">
                    <strong>{selected.title || selected.id}</strong>
                  </div>
                )}
              </InfoWindow>
            )}

            {children}
          </Map>
        ) : (
          <LeafletMapComponent
            center={center}
            zoom={zoom}
            markers={markers}
            onMarkerClick={handleMarkerClick}
          />
        )}
      </div>
    </div>
  );
}
