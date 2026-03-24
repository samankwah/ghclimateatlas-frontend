// Water bodies overlay for Ghana (lakes, rivers, lagoons)

import { GeoJSON, useMap } from "react-leaflet";
import { useCallback, useMemo, useRef } from "react";
import type { PathOptions } from "leaflet";
import type { FeatureCollection, Feature } from "geojson";
import waterAreas from "../../assets/ghana_water_areas.geojson";

const PANE_NAME = "water-bodies";

interface WaterBodiesLayerProps {
  visible?: boolean;
  opacity?: number;
  activeVariableId?: string;
}

const WaterBodiesLayer: React.FC<WaterBodiesLayerProps> = ({
  visible = true,
  opacity = 0.55,
  activeVariableId,
}) => {
  const map = useMap();
  const paneCreated = useRef(false);

  // Create the pane synchronously so it exists before GeoJSON renders.
  if (!paneCreated.current && !map.getPane(PANE_NAME)) {
    const pane = map.createPane(PANE_NAME);
    pane.style.zIndex = "450";
    pane.style.pointerEvents = "none";
    paneCreated.current = true;
  }

  const waterData = useMemo<FeatureCollection>(
    () => ({
      type: "FeatureCollection",
      features: (waterAreas as unknown as { features: Feature[] }).features,
    }),
    []
  );

  const isPrecipitation = activeVariableId?.includes("precipitation") ?? false;

  const stylePerFeature = useCallback(
    (feature: Feature | undefined): PathOptions => {
      const isPerennial = feature?.properties?.HYC_DESCRI === "Perennial/Permanent";
      const fillColor = isPrecipitation ? "#f3f4f6" : "rgba(65, 145, 220, 1)";
      const strokeColor = isPrecipitation ? "#d1d5db" : "#4191dc";
      return {
        pane: PANE_NAME,
        fillColor,
        fillOpacity: isPerennial ? opacity : opacity * 0.6,
        weight: 0.7,
        color: strokeColor,
        opacity: 0.75,
        interactive: false,
      };
    },
    [opacity, isPrecipitation]
  );

  if (!visible) return null;

  return (
    <GeoJSON
      key={`water-bodies-${isPrecipitation ? "gray" : "blue"}`}
      data={waterData}
      style={stylePerFeature}
      interactive={false}
    />
  );
};

export default WaterBodiesLayer;
