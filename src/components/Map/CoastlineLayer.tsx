// Coastline overlay that renders colored line segments for sea level rise visualization.
// Each segment corresponds to a coastal district and is colored/weighted by its sea level value.

import { GeoJSON } from "react-leaflet";
import { useCallback, useEffect, useState } from "react";
import type { PathOptions, Layer } from "leaflet";
import type { Feature, FeatureCollection } from "geojson";
import { formatValue, formatChange } from "../../utils/colorScales";

interface CoastlineLayerProps {
  visible: boolean;
  valueMap: Map<string, number>;
  colorFn: (value: number, min: number, max: number) => string;
  minValue: number;
  maxValue: number;
  onDistrictClick: (districtId: string) => void;
  onDistrictHover: (districtId: string | null) => void;
  selectedDistrictId: string | null;
  showChange?: boolean;
  unit: string;
  dataVersion?: string;
}

// Min/max line weight in pixels — thin for near-term, thick band for end-century
const MIN_WEIGHT = 1.5;
const MAX_WEIGHT = 12;
// Power curve exponent — amplifies visual differences at higher values
const WEIGHT_POWER = 1.5;

const CoastlineLayer: React.FC<CoastlineLayerProps> = ({
  visible,
  valueMap,
  colorFn,
  minValue,
  maxValue,
  onDistrictClick,
  onDistrictHover,
  selectedDistrictId,
  showChange = false,
  unit,
  dataVersion,
}) => {
  // Lazy-load the GeoJSON so its ~322 kB stays out of the main bundle, which
  // otherwise has to parse before the map can render at all.
  const [data, setData] = useState<FeatureCollection | null>(null);

  useEffect(() => {
    if (!visible || data) return;
    let cancelled = false;
    import("../../assets/ghana_coastline_segments.geojson").then((mod) => {
      if (cancelled) return;
      const raw = (mod.default ?? mod) as unknown as { features: Feature[] };
      setData({ type: "FeatureCollection", features: raw.features });
    });
    return () => {
      cancelled = true;
    };
  }, [visible, data]);

  const getWeight = useCallback(
    (value: number): number => {
      if (maxValue === minValue) return (MIN_WEIGHT + MAX_WEIGHT) / 2;
      const t = Math.max(0, Math.min(1, (value - minValue) / (maxValue - minValue)));
      const tCurved = Math.pow(t, WEIGHT_POWER);
      return MIN_WEIGHT + tCurved * (MAX_WEIGHT - MIN_WEIGHT);
    },
    [minValue, maxValue]
  );

  const style = useCallback(
    (feature: Feature | undefined): PathOptions => {
      if (!feature?.properties) {
        return { color: "#feb24c", weight: MIN_WEIGHT, opacity: 0.9 };
      }

      const districtId = feature.properties.district_id as string;
      const value = valueMap.get(districtId);
      const isSelected = districtId === selectedDistrictId;

      if (value === undefined) {
        return {
          color: "#fed976",
          weight: MIN_WEIGHT,
          opacity: 0.6,
          lineCap: "round",
          lineJoin: "round",
        };
      }

      return {
        color: colorFn(value, minValue, maxValue),
        weight: isSelected ? getWeight(value) + 3 : getWeight(value),
        opacity: isSelected ? 1 : 0.92,
        lineCap: "round",
        lineJoin: "round",
      };
    },
    [valueMap, colorFn, minValue, maxValue, selectedDistrictId, getWeight]
  );

  const onEachFeature = useCallback(
    (feature: Feature, layer: Layer) => {
      const districtId = feature.properties?.district_id as string;
      const districtName = feature.properties?.district_name as string;
      const region = feature.properties?.region as string;

      const value = valueMap.get(districtId);
      const formattedValue =
        value !== undefined
          ? showChange
            ? formatChange(value, unit)
            : formatValue(value, unit)
          : "No data";

      const tooltipContent = `
        <strong>${districtName}</strong><br/>
        ${region}<br/>
        Direct coastal exposure<br/>
        ${formattedValue}
      `;
      layer.bindTooltip(tooltipContent, { sticky: true });

      layer.on({
        click: () => onDistrictClick(districtId),
        mouseover: () => onDistrictHover(districtId),
        mouseout: () => onDistrictHover(null),
      });
    },
    [valueMap, showChange, unit, onDistrictClick, onDistrictHover]
  );

  if (!visible || !data) return null;

  return (
    <GeoJSON
      key={dataVersion}
      data={data}
      style={style}
      onEachFeature={onEachFeature}
    />
  );
};

export default CoastlineLayer;
