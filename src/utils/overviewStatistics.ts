import type { ClimateTimeSeriesResponse } from "../types/climate";

export interface LateCenturyProjectionStatistic {
  absoluteChange: number;
  lateEnd: number;
  lateMean: number;
  lateStart: number;
  percentChange: number | null;
  referenceEnd: number;
  referenceMean: number;
  referenceStart: number;
  unit: string;
}

const LATE_CENTURY_START = 2081;
const LATE_CENTURY_END = 2100;

export const summarizeLateCenturyProjection = (
  series: ClimateTimeSeriesResponse,
): LateCenturyProjectionStatistic | null => {
  const lateCenturyValues = series.data
    .filter(({ year, p50 }) => (
      year >= LATE_CENTURY_START
      && year <= LATE_CENTURY_END
      && Number.isFinite(p50)
    ))
    .map(({ p50 }) => p50);

  if (!lateCenturyValues.length || !Number.isFinite(series.reference_mean)) return null;

  const lateMean = lateCenturyValues.reduce((total, value) => total + value, 0)
    / lateCenturyValues.length;
  const absoluteChange = lateMean - series.reference_mean;
  const percentChange = series.reference_mean === 0
    ? null
    : (absoluteChange / Math.abs(series.reference_mean)) * 100;

  return {
    absoluteChange,
    lateEnd: LATE_CENTURY_END,
    lateMean,
    lateStart: LATE_CENTURY_START,
    percentChange,
    referenceEnd: series.reference_period.end,
    referenceMean: series.reference_mean,
    referenceStart: series.reference_period.start,
    unit: series.unit,
  };
};

export type OverviewStatisticKind = "temperature" | "rainfall" | "sea-level" | "stories";

export interface OverviewStatisticDisplay {
  decimals: number;
  /** Projected changes carry an explicit +/-; plain counts do not. */
  signed: boolean;
  suffix: string;
  value: number;
}

// Splits a projection statistic into the number that can be animated and the
// unit suffix that stays put while it counts. `unit` is passed in already
// normalized (via normalizeUnit) so this module stays dependency-free.
export const overviewStatisticDisplay = (
  kind: OverviewStatisticKind,
  statistic: LateCenturyProjectionStatistic,
  unit: string,
): OverviewStatisticDisplay => {
  if (kind === "temperature") {
    return { decimals: 1, signed: true, suffix: unit || "°C", value: statistic.absoluteChange };
  }

  if (kind === "rainfall" && statistic.percentChange !== null) {
    return { decimals: 1, signed: true, suffix: "%", value: statistic.percentChange };
  }

  if (kind === "sea-level" && unit === "m") {
    return { decimals: 0, signed: true, suffix: " cm", value: statistic.absoluteChange * 100 };
  }

  return {
    decimals: unit === "cm" ? 1 : 0,
    signed: true,
    suffix: unit ? ` ${unit}` : "",
    value: statistic.absoluteChange,
  };
};

export const formatOverviewStatistic = (
  display: OverviewStatisticDisplay,
  value: number = display.value,
): string => {
  const rounded = Number(value.toFixed(display.decimals));
  const sign = display.signed && rounded > 0 ? "+" : "";
  return `${sign}${rounded.toFixed(display.decimals)}${display.suffix}`;
};
