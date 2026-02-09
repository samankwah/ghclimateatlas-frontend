// Map zoom controls - bottom-left overlay with +, -, and Find Me buttons

import { useState } from "react";
import { useMap, CircleMarker, Tooltip } from "react-leaflet";

const MapZoomControls: React.FC = () => {
  const map = useMap();
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [locating, setLocating] = useState(false);

  const handleFindMe = () => {
    if (!("geolocation" in navigator)) return;

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const latlng: [number, number] = [latitude, longitude];
        setUserLocation(latlng);
        map.flyTo(latlng, 10, { duration: 1.5 });
        setLocating(false);
      },
      (error) => {
        console.error("Geolocation error:", error);
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

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
          title="Find My Location"
          aria-label="Find My Location"
          disabled={locating}
        >
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M12 2v4" />
            <path d="M12 18v4" />
            <path d="M2 12h4" />
            <path d="M18 12h4" />
          </svg>
        </button>
      </div>

      {/* User location marker */}
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
