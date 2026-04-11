import { useMemo, type CSSProperties } from "react";
import type { ClimateVariable } from "../../types/climate";
import { generateLegendStops, normalizeUnit, type ColorScaleType } from "../../utils/colorScales";
import {
  getFixedDisplayRange,
  getFixedLegendTicks,
  getLegendTickValues,
} from "../../utils/displayRanges";

interface LegendProps {
  variable: ClimateVariable | undefined;
  minValue: number;
  maxValue: number;
  colorScaleType: ColorScaleType;
  showChange?: boolean;
  className?: string;
  floating?: boolean;
}

const Legend: React.FC<LegendProps> = ({
  variable,
  minValue,
  maxValue,
  colorScaleType,
  showChange = false,
  className = "",
  floating = false,
}) => {
  const legendRange = useMemo(() => {
    if (!showChange && variable) {
      if (variable.id === "wet_days") {
        return { min: 0, max: 365 };
      }

      const fixedRange = getFixedDisplayRange(variable.id, variable.color_scale);
      if (fixedRange) {
        return fixedRange;
      }
    }

    return { min: minValue, max: maxValue };
  }, [maxValue, minValue, showChange, variable]);

  const gradientStyle = useMemo(() => {
    const stops = generateLegendStops(
      legendRange.min,
      legendRange.max,
      showChange ? "diverging" : colorScaleType,
      5
    );
    const colors = stops.map((stop) => stop.color).join(", ");
    return {
      background: `linear-gradient(to right, ${colors})`,
    };
  }, [colorScaleType, legendRange.max, legendRange.min, showChange]);

  const legendTicks = useMemo(() => {
    if (showChange) {
      return [legendRange.min, 0, legendRange.max].filter((value, index, values) => values.indexOf(value) === index);
    }

    if (variable) {
      if (variable.id === "wet_days") {
        return getLegendTickValues({ min: 0, max: 365 }, { steps: 5, integer: true });
      }

      const fixedTicks = getFixedLegendTicks(variable.id, variable.color_scale);
      if (fixedTicks) {
        return fixedTicks;
      }

      const fixedRange = getFixedDisplayRange(variable.id, variable.color_scale);
      if (fixedRange) {
        const steps = variable.color_scale === "temperature" ? 9 : 5;
        return getLegendTickValues(fixedRange, { steps, integer: true });
      }
    }

    return getLegendTickValues(legendRange, { steps: 5, integer: true });
  }, [legendRange, showChange, variable]);

  const legendTickPositions = useMemo(() => {
    const lastIndex = Math.max(legendTicks.length - 1, 1);
    return legendTicks.map((tick, index) => ({
      value: tick,
      leftPercent: (index / lastIndex) * 100,
    }));
  }, [legendTicks]);

  const legendScaleStyle = useMemo<CSSProperties>(() => {
    const width = variable?.color_scale === "precipitation"
      ? (floating ? "360px" : "420px")
      : variable?.color_scale === "temperature"
        ? (floating ? "320px" : "380px")
        : (floating ? "280px" : "280px");

    return (
      floating
        ? { "--legend-base-width": width }
        : {
            "--legend-base-width": width,
            "--legend-width": width,
          }
    ) as unknown as CSSProperties;
  }, [floating, variable]);

  const displayUnit = normalizeUnit(variable?.unit || "°C");

  return (
    <div className={className} style={legendScaleStyle}>
      <span className="legend-label">
        {showChange ? "Change" : "Average value"} ({displayUnit})
      </span>
      <div className="legend-scale">
        <div className="legend-bar-container">
          <div className="legend-gradient" style={gradientStyle} />
          {legendTickPositions.map((tick, index) => (
            <span
              key={`line-${index}`}
              className="legend-tick-mark"
              style={{ left: `${tick.leftPercent}%` }}
            />
          ))}
        </div>
        <div className="legend-tick-row legend-tick-row-inline">
          {legendTickPositions.map((tick, index) => {
            return (
              <span
                key={index}
                className={`legend-grid-value${index === 0 ? " is-start" : ""}${index === legendTickPositions.length - 1 ? " is-end" : ""}`}
              >
                {tick.value > 0 && showChange ? "+" : ""}
                {tick.value.toFixed(colorScaleType === "sea_level" && !showChange ? 1 : 0)}
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Legend;
