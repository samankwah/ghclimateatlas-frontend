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
  const gradientStyle = useMemo(() => {
    const stops = generateLegendStops(
      minValue,
      maxValue,
      showChange ? "diverging" : colorScaleType,
      5
    );
    const colors = stops.map((stop) => stop.color).join(", ");
    return {
      background: `linear-gradient(to right, ${colors})`,
    };
  }, [minValue, maxValue, colorScaleType, showChange]);

  const legendTicks = useMemo(() => {
    if (showChange) {
      return [minValue, 0, maxValue].filter((value, index, values) => values.indexOf(value) === index);
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

    return getLegendTickValues({ min: minValue, max: maxValue }, { steps: 5, integer: true });
  }, [maxValue, minValue, showChange, variable]);

  const legendTickPositions = useMemo(() => {
    const range = maxValue - minValue || 1;
    return legendTicks.map((tick) => ({
      value: tick,
      leftPercent: ((tick - minValue) / range) * 100,
    }));
  }, [legendTicks, maxValue, minValue]);

  const legendScaleStyle = useMemo<CSSProperties>(() => {
    const width = variable?.color_scale === "precipitation"
      ? (floating ? "360px" : "420px")
      : variable?.color_scale === "temperature"
        ? (floating ? "320px" : "320px")
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
          {legendTickPositions.map((tick) => (
            <span
              key={`line-${tick.value}`}
              className="legend-tick-mark"
              style={{ left: `${tick.leftPercent}%` }}
            />
          ))}
        </div>
        <div className="legend-tick-row">
          {legendTickPositions.map((tick, index) => {
            let labelStyle: CSSProperties = { left: `${tick.leftPercent}%` };

            if (variable?.color_scale === "precipitation" && tick.value === 2300) {
              labelStyle = {
                left: "100%",
                transform: "translateX(-100%)",
              };
            }

            return (
              <span
                key={tick.value}
                className={`legend-value${index === 0 ? " is-start" : ""}${index === legendTickPositions.length - 1 ? " is-end" : ""}`}
                style={labelStyle}
              >
                {tick.value > 0 && showChange ? "+" : ""}
                {tick.value.toFixed(0)}
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Legend;
