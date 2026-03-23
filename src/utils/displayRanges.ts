import type { ClimateVariable } from "../types/climate";

export interface DisplayRange {
  min: number;
  max: number;
}

const VARIABLE_RANGES: Record<string, DisplayRange> = {
  annual_mean_temp: { min: 26, max: 35 },
  annual_max_temp: { min: 26, max: 35 },
  annual_min_temp: { min: 26, max: 35 },
  mean_temp_apr_may_jun: { min: 26, max: 35 },
  mean_temp_jul_aug_sep: { min: 26, max: 35 },
  mean_temp_sep_oct_nov: { min: 26, max: 35 },
  mean_temp_dry_season: { min: 26, max: 35 },
  mean_temp_dec_jan_feb: { min: 26, max: 35 },
  annual_precipitation: { min: 500, max: 2500 },
  wet_season_precipitation: { min: 500, max: 2500 },
  precipitation_apr_may_jun: { min: 500, max: 2500 },
  precipitation_jul_aug_sep: { min: 500, max: 2500 },
  precipitation_sep_oct_nov: { min: 500, max: 2500 },
  precipitation_dec_jan_feb: { min: 500, max: 2500 },
};

const COLOR_SCALE_DEFAULTS: Partial<Record<ClimateVariable["color_scale"], DisplayRange>> = {
  temperature: { min: 26, max: 35 },
  precipitation: { min: 500, max: 2500 },
};

export const getFixedDisplayRange = (
  variableId: string,
  colorScale?: string,
): DisplayRange | undefined => {
  const direct = VARIABLE_RANGES[variableId];
  if (direct) {
    return direct;
  }

  if (colorScale === "temperature" || colorScale === "precipitation") {
    return COLOR_SCALE_DEFAULTS[colorScale];
  }

  return undefined;
};

export const getLegendTickValues = (
  range: DisplayRange,
  options?: { steps?: number; integer?: boolean },
): number[] => {
  const steps = options?.steps ?? 5;
  const integer = options?.integer ?? false;
  const values: number[] = [];

  for (let i = 0; i <= steps; i++) {
    const value = range.min + ((range.max - range.min) * i) / steps;
    values.push(integer ? Math.round(value) : Math.round(value * 10) / 10);
  }

  return values;
};

export const getFixedLegendTicks = (
  variableId: string,
  colorScale?: string,
): number[] | undefined => {
  if (colorScale === "precipitation" || variableId === "annual_precipitation") {
    return [500, 900, 1300, 1700, 2100, 2500];
  }

  if (colorScale === "temperature" || variableId === "annual_mean_temp") {
    return [26, 27, 28, 29, 30, 31, 32, 33, 34, 35];
  }

  return undefined;
};
