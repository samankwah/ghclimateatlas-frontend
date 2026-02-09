// Color scale legend component

import { useMemo } from "react";
import { generateLegendStops, type ColorScaleType } from "../../utils/colorScales";

interface LegendProps {
  title: string;
  unit: string;
  min: number;
  max: number;
  colorScaleType: ColorScaleType;
  showChange?: boolean;
}

const Legend: React.FC<LegendProps> = ({
  title,
  unit,
  min,
  max,
  colorScaleType,
  showChange = false,
}) => {
  const stops = useMemo(() => {
    return generateLegendStops(
      min,
      max,
      showChange ? "diverging" : colorScaleType,
      5
    );
  }, [min, max, colorScaleType, showChange]);

  const gradientStyle = useMemo(() => {
    const colors = stops.map((s) => s.color).join(", ");
    return {
      background: `linear-gradient(to right, ${colors})`,
    };
  }, [stops]);

  return (
    <div className="legend">
      <div className="legend-title">
        {title}
        {showChange && " (Change)"}
      </div>
      <div className="legend-bar" style={gradientStyle} />
      <div className="legend-labels">
        <span>
          {showChange && min > 0 ? "+" : ""}
          {min.toFixed(1)} {unit}
        </span>
        <span>
          {showChange && max > 0 ? "+" : ""}
          {max.toFixed(1)} {unit}
        </span>
      </div>
    </div>
  );
};

export default Legend;
