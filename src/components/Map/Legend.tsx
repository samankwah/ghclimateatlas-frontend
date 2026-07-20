import { useMemo, type CSSProperties } from "react";
import type { ClimateVariable } from "../../types/climate";
import { getColorScale, normalizeUnit, type ColorScaleType } from "../../utils/colorScales";
import {
  getFixedDisplayRange,
  getFixedLegendTicks,
  getLegendTickValues,
} from "../../utils/displayRanges";
import { getUniqueDisplayedTicks } from "../../utils/legendTicks";

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

  const rawLegendTicks = useMemo(() => {
    if (showChange) {
      return getLegendTickValues(legendRange, { steps: 6, integer: true });
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

  const legendTicks = useMemo(
    () => getUniqueDisplayedTicks(rawLegendTicks, colorScaleType, showChange),
    [colorScaleType, rawLegendTicks, showChange],
  );

  const legendTickPositions = useMemo(() => {
    const firstValue = legendTicks[0]?.value ?? legendRange.min;
    const lastValue = legendTicks[legendTicks.length - 1]?.value ?? legendRange.max;
    const span = lastValue - firstValue;

    return legendTicks.map((tick) => ({
      ...tick,
      leftPercent: span === 0 ? 0 : ((tick.value - firstValue) / span) * 100,
    }));
  }, [legendRange.max, legendRange.min, legendTicks]);

  const legendSteps = useMemo(() => {
    const colorScale = getColorScale(colorScaleType);

    if (legendTicks.length <= 1) {
      const midpoint = legendRange.min + (legendRange.max - legendRange.min) / 2;
      return [{
        color: colorScale(midpoint, legendRange.min, legendRange.max),
        widthPercent: 100,
      }];
    }

    const firstValue = legendTicks[0].value;
    const lastValue = legendTicks[legendTicks.length - 1].value;
    const span = lastValue - firstValue;

    return legendTicks.slice(0, -1).map((tick, index) => {
      const nextTick = legendTicks[index + 1];
      const midpoint = tick.value + (nextTick.value - tick.value) / 2;

      return {
        color: colorScale(midpoint, legendRange.min, legendRange.max),
        widthPercent: span === 0
          ? 100 / (legendTicks.length - 1)
          : ((nextTick.value - tick.value) / span) * 100,
      };
    });
  }, [colorScaleType, legendRange.max, legendRange.min, legendTicks]);

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
        {showChange ? "Change from baseline" : "Average value"} ({displayUnit})
      </span>
      <div className="legend-scale">
        <div className="legend-bar-container">
          <div className="legend-steps" aria-hidden="true">
            {legendSteps.map((step, index) => (
              <span
                key={`step-${index}`}
                className="legend-step"
                style={{
                  backgroundColor: step.color,
                  width: `${step.widthPercent}%`,
                }}
              />
            ))}
          </div>
          {legendTickPositions.map((tick) => (
            <span
              key={`line-${tick.label}`}
              className="legend-tick-mark"
              style={{ left: `${tick.leftPercent}%` }}
            />
          ))}
        </div>
        <div className="legend-tick-row">
          {legendTickPositions.map((tick, index) => (
            <span
              key={tick.label}
              className={`legend-value${index === 0 ? " is-start" : ""}${index > 0 && index === legendTickPositions.length - 1 ? " is-end" : ""}`}
              style={{ left: `${tick.leftPercent}%` }}
            >
              {tick.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Legend;
