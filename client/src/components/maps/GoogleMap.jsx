import { useCallback, useState } from "react";
import {
  Map,
  AdvancedMarker,
  Pin,
  InfoWindow,
} from "@vis.gl/react-google-maps";
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
 * Reusable Google Map component.
 *
 * @param {Object}   props
 * @param {{ lat: number, lng: number }} [props.center]     Map centre (default: Sri Lanka)
 * @param {number}   [props.zoom]            Zoom level (default: 8)
 * @param {Array}    [props.markers]          Array of marker objects { id, lat, lng, colorKey, data }
 * @param {Function} [props.onMarkerClick]    Callback when a marker is clicked — receives the marker object
 * @param {Function} [props.onMapClick]       Callback when the map surface is clicked — receives { lat, lng }
 * @param {Function} [props.renderInfoWindow] Custom InfoWindow renderer — receives selected marker data
 * @param {string}   [props.className]        Additional CSS class names
 * @param {Object}   [props.style]            Inline styles
 * @param {React.ReactNode} [props.children]  Additional children rendered inside the <Map>
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
      // Close any open info window
      setSelected(null);

      if (!onMapClick) return;
      const latLng = e.detail?.latLng;
      if (latLng) onMapClick({ lat: latLng.lat, lng: latLng.lng });
    },
    [onMapClick],
  );

  return (
    <div
      className={cn("map-container relative rounded-2xl overflow-hidden border border-border", className)}
      style={style}
    >
      <div className="absolute inset-0">
        <Map
          defaultCenter={center || SRI_LANKA}
          defaultZoom={zoom || DEFAULT_ZOOM}
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

        {/* InfoWindow for the selected marker */}
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
      </div>
    </div>
  );
}
