import { useCallback, useState } from "react";
import {
  Map,
  AdvancedMarker,
  Pin,
} from "@vis.gl/react-google-maps";
import { Crosshair, Loader2 } from "lucide-react";
import Button from "../common/Button";
import { cn } from "../../utils/helpers";

/** Default map centre — Sri Lanka. */
const SRI_LANKA = { lat: 7.8731, lng: 80.7718 };

/**
 * Interactive map component for picking a location.
 *
 * @param {Object}   props
 * @param {{ lat: number, lng: number } | null} [props.value]   Current selected location
 * @param {Function} props.onChange           Callback — receives { lat, lng } or null
 * @param {string}   [props.className]        Extra wrapper classes
 */
export default function LocationPicker({ value, onChange, className }) {
  const [locating, setLocating] = useState(false);
  const [geoError, setGeoError] = useState(null);

  /* Handle click on the map surface to place/move the marker. */
  const handleMapClick = useCallback(
    (e) => {
      setGeoError(null);
      const latLng = e.detail?.latLng;
      if (latLng) {
        onChange?.({ lat: latLng.lat, lng: latLng.lng });
      }
    },
    [onChange],
  );

  /* Use the browser's geolocation API. */
  const useCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setGeoError("Your browser does not support geolocation.");
      return;
    }

    setLocating(true);
    setGeoError(null);

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        onChange?.({ lat: coords.latitude, lng: coords.longitude });
        setLocating(false);
      },
      (err) => {
        setLocating(false);
        switch (err.code) {
          case err.PERMISSION_DENIED:
            setGeoError(
              "Location permission was denied. Please enable location access in your browser settings.",
            );
            break;
          case err.POSITION_UNAVAILABLE:
            setGeoError("Location information is unavailable. Please try again later.");
            break;
          case err.TIMEOUT:
            setGeoError("Location request timed out. Please try again.");
            break;
          default:
            setGeoError("An unknown error occurred while getting your location.");
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    );
  }, [onChange]);

  const center = value ?? SRI_LANKA;
  const zoom = value ? 15 : 8;

  return (
    <div className={cn("space-y-3", className)}>
      {/* Map */}
      <div className="map-container h-56 overflow-hidden rounded-xl border border-border">
        <Map
          defaultCenter={center}
          center={center}
          zoom={zoom}
          mapId="DEMO_MAP_ID"
          gestureHandling="cooperative"
          disableDefaultUI
          zoomControl
          onClick={handleMapClick}
          style={{ width: "100%", height: "100%" }}
        >
          {value && (
            <AdvancedMarker position={value}>
              <Pin
                background="#0d9488"
                borderColor="#0f766e"
                glyphColor="#fff"
              />
            </AdvancedMarker>
          )}
        </Map>
      </div>

      {/* Use My Current Location button */}
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="w-full text-xs"
        onClick={useCurrentLocation}
        disabled={locating}
      >
        {locating ? (
          <>
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Detecting location…
          </>
        ) : (
          <>
            <Crosshair className="h-3.5 w-3.5" /> Use My Current Location
          </>
        )}
      </Button>

      {/* Error message */}
      {geoError && (
        <p className="rounded-lg bg-destructive/10 border border-destructive/20 px-3 py-2 text-xs text-destructive">
          {geoError}
        </p>
      )}

      {/* Selected coordinates display */}
      {value && (
        <div className="rounded-xl border border-dashed border-border bg-muted/30 p-3 text-xs text-muted-foreground">
          📍 GPS: {value.lat.toFixed(6)}° N, {value.lng.toFixed(6)}° E
          <span className="ml-2 text-[10px] opacity-70">(click map or drag to change)</span>
        </div>
      )}
    </div>
  );
}
