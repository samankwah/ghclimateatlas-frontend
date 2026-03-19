// Water bodies overlay for Ghana (lakes, rivers, lagoons)

import { GeoJSON } from "react-leaflet";
import { useState, useEffect, useCallback } from "react";
import type { PathOptions } from "leaflet";
import type { FeatureCollection, Feature } from "geojson";

interface WaterBodiesLayerProps {
  visible?: boolean;
  opacity?: number;
}

const WaterBodiesLayer: React.FC<WaterBodiesLayerProps> = ({
  visible = true,
  opacity = 0.55,
}) => {
  const [waterData, setWaterData] = useState<FeatureCollection | null>(null);

  // Lazy-load the GeoJSON
  useEffect(() => {
    import("../../assets/ghana_water_areas.geojson").then((mod) => {
      const raw = (mod.default ?? mod) as unknown as { features: Feature[] };
      setWaterData({
        type: "FeatureCollection",
        features: raw.features,
      });
    });
  }, []);

  const stylePerFeature = useCallback(
    (feature: Feature | undefined): PathOptions => {
      const isPerennial = feature?.properties?.HYC_DESCRI === "Perennial/Permanent";
      return {
        fillColor: "rgba(65, 145, 220, 1)",
        fillOpacity: isPerennial ? opacity : opacity * 0.6,
        weight: 0.7,
        color: "#4191dc",
        opacity: 0.75,
        interactive: false,
      };
    },
    [opacity]
  );

  if (!visible || !waterData) return null;

  return (
    <GeoJSON
      data={waterData}
      style={stylePerFeature}
      interactive={false}
    />
  );
};

export default WaterBodiesLayer;
