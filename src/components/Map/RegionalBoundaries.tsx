// Regional administrative boundaries overlay for Ghana

import { GeoJSON } from "react-leaflet";
import { useMemo, useState, useEffect } from "react";
import type { PathOptions } from "leaflet";
import type { FeatureCollection, Feature } from "geojson";

interface RegionalBoundariesProps {
  visible?: boolean;
  opacity?: number;
  color?: string;
  weight?: number;
}

const RegionalBoundaries: React.FC<RegionalBoundariesProps> = ({
  visible = true,
  opacity = 0.6,
  color = "#ffffff",
  weight = 1.5,
}) => {
  const [ghanaRegions, setGhanaRegions] = useState<FeatureCollection | null>(null);

  // Lazy-load the GeoJSON
  useEffect(() => {
    import("../../assets/ghana_regions.geojson").then((mod) => {
      const raw = (mod.default ?? mod) as unknown as { features: Feature[] };
      setGhanaRegions({
        type: "FeatureCollection",
        features: raw.features,
      });
    });
  }, []);

  const style = useMemo(
    (): PathOptions => ({
      fillOpacity: 0,
      weight,
      color,
      opacity,
      interactive: false,
    }),
    [opacity, color, weight]
  );

  if (!visible || !ghanaRegions) return null;

  return (
    <GeoJSON
      data={ghanaRegions}
      style={style}
      interactive={false}
    />
  );
};

export default RegionalBoundaries;
