// Map zoom and browser-geolocation controls.

import { useState } from "react";
import { useMap, CircleMarker, Tooltip } from "react-leaflet";
import type { DistrictFeatureCollection } from "../../types/climate";
import {
  GEOLOCATION_FAILURE_MESSAGES,
  requestBrowserLocation,
  type GeolocationFailureReason,
} from "../../utils/browserGeolocation";
import { resolveDistrictLocation } from "../../utils/districtLocation";

interface MapZoomControlsProps {
  districts: DistrictFeatureCollection | undefined;
  onDistrictSelect: (districtId: string) => void;
}

type LocationState =
  | { status: "idle"; message: "" }
  | { status: "locating" | "success" | GeolocationFailureReason; message: string };

const MapZoomControls: React.FC<MapZoomControlsProps> = ({ districts, onDistrictSelect }) => {
  const map = useMap();
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [locationState, setLocationState] = useState<LocationState>({ status: "idle", message: "" });
  const locating = locationState.status === "locating";
  const districtsReady = Boolean(districts?.features.length);

  const handleFindMe = async () => {
    if (!districtsReady) return;

    setLocationState({ status: "locating", message: "Finding your location…" });
    const geolocation = typeof navigator === "undefined" ? undefined : navigator.geolocation;
    const browserLocation = await requestBrowserLocation(geolocation);

    if (!browserLocation.ok) {
      setLocationState({
        status: browserLocation.reason,
        message: GEOLOCATION_FAILURE_MESSAGES[browserLocation.reason],
      });
      return;
    }

    const { latitude, longitude } = browserLocation;
    const userLatLng: [number, number] = [latitude, longitude];
    setUserLocation(userLatLng);

    const resolution = resolveDistrictLocation([longitude, latitude], districts);
    if (!resolution) {
      setLocationState({
        status: "unavailable",
        message: "We couldn’t match your location to an available district.",
      });
      return;
    }

    const { district, kind, districtPosition } = resolution;
    onDistrictSelect(district.properties.id);

    if (kind === "exact") {
      map.flyTo(userLatLng, 10, { duration: 1.5 });
      setLocationState({
        status: "success",
        message: `${district.properties.name} · ${district.properties.region}`,
      });
      return;
    }

    map.flyTo([districtPosition[1], districtPosition[0]], 9, { duration: 1.5 });
    setLocationState({
      status: "success",
      message: `Nearest district: ${district.properties.name} · ${district.properties.region} (approximate)`,
    });
  };

  const locationButtonTitle = !districtsReady
    ? "Find My Location is available after district boundaries load"
    : locating
      ? "Finding your location"
      : "Find My Location";

  return (
    <>
      <div className="map-zoom-controls">
        <button
          className="zoom-btn"
          onClick={() => map.zoomIn()}
          title="Zoom in"
          aria-label="Zoom in"
        >
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>
        <button
          className="zoom-btn"
          onClick={() => map.zoomOut()}
          title="Zoom out"
          aria-label="Zoom out"
        >
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>
        <button
          className={`zoom-btn find-me ${locating ? "active" : ""}`}
          onClick={handleFindMe}
          title={locationButtonTitle}
          aria-label={locationButtonTitle}
          aria-busy={locating}
          aria-describedby={locationState.status !== "idle" ? "map-location-status" : undefined}
          disabled={locating || !districtsReady}
        >
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M12 2v4" />
            <path d="M12 18v4" />
            <path d="M2 12h4" />
            <path d="M18 12h4" />
          </svg>
        </button>

        {locationState.status !== "idle" && (
          <div
            id="map-location-status"
            className={`map-location-status ${locationState.status}`}
            role="status"
            aria-live="polite"
          >
            {locationState.message}
          </div>
        )}
      </div>

      {userLocation && (
        <CircleMarker
          center={userLocation}
          radius={8}
          pathOptions={{
            color: "#3b82f6",
            fillColor: "#3b82f6",
            fillOpacity: 0.9,
            weight: 3,
          }}
        >
          <Tooltip direction="top" offset={[0, -8]}>
            <span className="city-tooltip">Your location</span>
          </Tooltip>
        </CircleMarker>
      )}
    </>
  );
};

export default MapZoomControls;
