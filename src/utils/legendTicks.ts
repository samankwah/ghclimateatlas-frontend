import type { ColorScaleType } from "./colorScales";

export interface DisplayedLegendTick {
  value: number;
  label: string;
}

export const formatLegendTick = (
  value: number,
  colorScaleType: ColorScaleType,
  showChange: boolean,
): string => {
  const decimalPlaces = colorScaleType === "sea_level" && !showChange ? 1 : 0;
  const roundedValue = Number(value.toFixed(decimalPlaces));
  const normalizedValue = Object.is(roundedValue, -0) ? 0 : roundedValue;
  const sign = showChange && normalizedValue > 0 ? "+" : "";

  return `${sign}${normalizedValue.toFixed(decimalPlaces)}`;
};

export const getUniqueDisplayedTicks = (
  values: number[],
  colorScaleType: ColorScaleType,
  showChange: boolean,
): DisplayedLegendTick[] => {
  const ticks = values.map((value) => ({
    value,
    label: formatLegendTick(value, colorScaleType, showChange),
  }));

  if (ticks.length <= 1) {
    return ticks;
  }

  const firstTick = ticks[0];
  const lastTick = ticks[ticks.length - 1];

  if (firstTick.label === lastTick.label) {
    return [firstTick];
  }

  const usedLabels = new Set([firstTick.label, lastTick.label]);
  const intermediateTicks = ticks.slice(1, -1).filter((tick) => {
    if (usedLabels.has(tick.label)) {
      return false;
    }

    usedLabels.add(tick.label);
    return true;
  });

  return [firstTick, ...intermediateTicks, lastTick];
};
