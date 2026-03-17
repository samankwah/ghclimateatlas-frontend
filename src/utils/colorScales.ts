// Color scales for climate data visualization

import { scaleSequential } from "d3-scale";
import {
  interpolateYlOrRd,
  interpolateBlues,
  interpolateBrBG,
  interpolateRdBu,
  interpolatePuBuGn,
} from "d3-scale-chromatic";

export type ColorScaleType =
  | "temperature"
  | "precipitation"
  | "hot_days"
  | "dry_days"
  | "sea_level"
  | "diverging";

const DEGREE_C = "\u00B0C";
const DEGREE_C_DAYS = "\u00B0C\u00B7days";

export const normalizeUnit = (unit: string): string => {
  return unit
    .replace(/Ã‚Â°CÃ‚Â·days/g, DEGREE_C_DAYS)
    .replace(/Â°CÂ·days/g, DEGREE_C_DAYS)
    .replace(/Ã‚Â°C/g, DEGREE_C)
    .replace(/Â°C/g, DEGREE_C)
    .trim();
};

export const temperatureScale = (value: number, min: number, max: number): string => {
  const scale = scaleSequential(interpolateYlOrRd).domain([min, max]);
  return scale(value);
};

export const precipitationScale = (value: number, min: number, max: number): string => {
  const scale = scaleSequential(interpolateBlues).domain([min, max]);
  return scale(value);
};

export const hotDaysScale = (value: number, min: number, max: number): string => {
  const scale = scaleSequential(interpolateYlOrRd).domain([min, max]);
  return scale(value);
};

export const dryDaysScale = (value: number, min: number, max: number): string => {
  const scale = scaleSequential(interpolateBrBG).domain([max, min]);
  return scale(value);
};

export const divergingScale = (value: number, min: number, max: number): string => {
  const absMax = Math.max(Math.abs(min), Math.abs(max));
  const scale = scaleSequential(interpolateRdBu).domain([absMax, -absMax]);
  return scale(value);
};

export const seaLevelScale = (value: number, min: number, max: number): string => {
  const scale = scaleSequential(interpolatePuBuGn).domain([min, max]);
  return scale(value);
};

export const getColorScale = (
  colorScaleType: ColorScaleType
): ((value: number, min: number, max: number) => string) => {
  switch (colorScaleType) {
    case "temperature":
      return temperatureScale;
    case "precipitation":
      return precipitationScale;
    case "hot_days":
      return hotDaysScale;
    case "dry_days":
      return dryDaysScale;
    case "diverging":
      return divergingScale;
    case "sea_level":
      return seaLevelScale;
    default:
      return temperatureScale;
  }
};

export const generateLegendStops = (
  min: number,
  max: number,
  colorScaleType: ColorScaleType,
  steps: number = 5
): { value: number; color: string }[] => {
  const colorFn = getColorScale(colorScaleType);
  const stops: { value: number; color: string }[] = [];

  for (let i = 0; i <= steps; i++) {
    const value = min + (max - min) * (i / steps);
    stops.push({
      value: Math.round(value * 10) / 10,
      color: colorFn(value, min, max),
    });
  }

  return stops;
};

export const formatValue = (value: number, unit: string): string => {
  const normalizedUnit = normalizeUnit(unit);

  if (normalizedUnit === DEGREE_C) {
    return `${value.toFixed(1)}${normalizedUnit}`;
  }
  if (normalizedUnit === "mm") {
    return `${Math.round(value)} ${normalizedUnit}`;
  }
  if (normalizedUnit === "days" || normalizedUnit === "events") {
    return `${Math.round(value)} ${normalizedUnit}`;
  }
  if (normalizedUnit === "cm") {
    return `${value.toFixed(1)} ${normalizedUnit}`;
  }
  if (normalizedUnit === "index") {
    return `${value.toFixed(1)} ${normalizedUnit}`;
  }
  if (normalizedUnit === DEGREE_C_DAYS || normalizedUnit === "Degree Days" || normalizedUnit === "MHU") {
    return `${Math.round(value).toLocaleString()} ${normalizedUnit}`;
  }
  return `${Math.round(value)} ${normalizedUnit}`;
};

export const formatChange = (change: number, unit: string): string => {
  const normalizedUnit = normalizeUnit(unit);
  const sign = change >= 0 ? "+" : "";

  if (normalizedUnit === DEGREE_C) {
    return `${sign}${change.toFixed(1)}${normalizedUnit}`;
  }
  if (normalizedUnit === "mm") {
    return `${sign}${Math.round(change)} ${normalizedUnit}`;
  }
  if (normalizedUnit === "days" || normalizedUnit === "events") {
    return `${sign}${Math.round(change)} ${normalizedUnit}`;
  }
  if (normalizedUnit === "cm" || normalizedUnit === "index") {
    return `${sign}${change.toFixed(1)} ${normalizedUnit}`;
  }
  if (normalizedUnit === DEGREE_C_DAYS || normalizedUnit === "Degree Days" || normalizedUnit === "MHU") {
    return `${sign}${Math.round(change).toLocaleString()} ${normalizedUnit}`;
  }
  return `${sign}${Math.round(change)} ${normalizedUnit}`;
};
