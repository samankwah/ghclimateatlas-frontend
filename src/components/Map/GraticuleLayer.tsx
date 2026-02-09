// Lat/Lon grid overlay (graticule) for the map

import { Polyline } from "react-leaflet";
import { useMemo } from "react";

interface GraticuleLayerProps {
  visible?: boolean;
}

// Ghana bounds with some padding
const LAT_MIN = 4;
const LAT_MAX = 12;
const LON_MIN = -4;
const LON_MAX = 2;
const STEP = 1; // 1-degree grid

const GraticuleLayer: React.FC<GraticuleLayerProps> = ({ visible = true }) => {
  const lines = useMemo(() => {
    const result: { positions: [number, number][]; label: string }[] = [];

    // Horizontal lines (latitude)
    for (let lat = LAT_MIN; lat <= LAT_MAX; lat += STEP) {
      result.push({
        positions: [
          [lat, LON_MIN],
          [lat, LON_MAX],
        ],
        label: `${lat}°N`,
      });
    }

    // Vertical lines (longitude)
    for (let lon = LON_MIN; lon <= LON_MAX; lon += STEP) {
      result.push({
        positions: [
          [LAT_MIN, lon],
          [LAT_MAX, lon],
        ],
        label: `${Math.abs(lon)}°${lon >= 0 ? "E" : "W"}`,
      });
    }

    return result;
  }, []);

  if (!visible) return null;

  return (
    <>
      {lines.map((line) => (
        <Polyline
          key={line.label}
          positions={line.positions}
          pathOptions={{
            color: "#94a3b8",
            weight: 0.5,
            opacity: 0.5,
            dashArray: "4 4",
            interactive: false,
          }}
        />
      ))}
    </>
  );
};

export default GraticuleLayer;
