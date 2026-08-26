// Water bodies overlay for Ghana (lakes, rivers, lagoons)

import { GeoJSON, useMap } from "react-leaflet";
import { useCallback, useEffect, useRef, useState } from "react";
import type { PathOptions } from "leaflet";
import type { FeatureCollection, Feature } from "geojson";

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

  // Lazy-load the GeoJSON so its ~147 kB stays out of the main bundle, and is
  // only fetched at all once the water overlay is actually switched on.
  const [waterData, setWaterData] = useState<FeatureCollection | null>(null);

  useEffect(() => {
    if (!visible || waterData) return;
    let cancelled = false;
    import("../../assets/ghana_water_areas.geojson").then((mod) => {
      if (cancelled) return;
      const raw = (mod.default ?? mod) as unknown as { features: Feature[] };
      setWaterData({ type: "FeatureCollection", features: raw.features });
    });
    return () => {
      cancelled = true;
    };
  }, [visible, waterData]);

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

  if (!visible || !waterData) return null;

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
