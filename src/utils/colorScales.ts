// Color scales for climate data visualization

import { scaleSequential } from "d3-scale";
import {
  interpolateYlOrRd,
  interpolateBlues,
  interpolateBrBG,
  interpolateRdBu,
} from "d3-scale-chromatic";

export type ColorScaleType =
  | "temperature"
  | "precipitation"
  | "hot_days"
  | "dry_days"
  | "diverging";

// Temperature scale: cool blue to hot red
export const temperatureScale = (value: number, min: number, max: number): string => {
  const scale = scaleSequential(interpolateYlOrRd).domain([min, max]);
  return scale(value);
};

// Precipitation scale: brown (dry) to blue (wet)
export const precipitationScale = (value: number, min: number, max: number): string => {
  const scale = scaleSequential(interpolateBlues).domain([min, max]);
  return scale(value);
};

// Hot days scale: yellow to dark red
export const hotDaysScale = (value: number, min: number, max: number): string => {
  const scale = scaleSequential(interpolateYlOrRd).domain([min, max]);
  return scale(value);
};

// Dry days scale
export const dryDaysScale = (value: number, min: number, max: number): string => {
  const scale = scaleSequential(interpolateBrBG).domain([max, min]); // Inverted: more dry = more brown
  return scale(value);
};

// Diverging scale for change values (decrease = blue, increase = red)
export const divergingScale = (value: number, min: number, max: number): string => {
  const absMax = Math.max(Math.abs(min), Math.abs(max));
  const scale = scaleSequential(interpolateRdBu).domain([absMax, -absMax]);
  return scale(value);
};

// Get the appropriate color scale function based on variable type
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
    default:
      return temperatureScale;
  }
};

// Generate legend stops for a scale
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

// Format value with unit
export const formatValue = (value: number, unit: string): string => {
  if (unit === "°C") {
    return `${value.toFixed(1)}${unit}`;
  }
  if (unit === "mm") {
    return `${Math.round(value)} ${unit}`;
  }
  if (unit === "days" || unit === "events") {
    return `${Math.round(value)} ${unit}`;
  }
  if (unit === "°C·days" || unit === "Degree Days" || unit === "MHU") {
    return `${Math.round(value).toLocaleString()} ${unit}`;
  }
  return `${Math.round(value)} ${unit}`;
};

// Format change value
export const formatChange = (change: number, unit: string): string => {
  const sign = change >= 0 ? "+" : "";
  if (unit === "°C") {
    return `${sign}${change.toFixed(1)}${unit}`;
  }
  if (unit === "mm") {
    return `${sign}${Math.round(change)} ${unit}`;
  }
  if (unit === "days" || unit === "events") {
    return `${sign}${Math.round(change)} ${unit}`;
  }
  if (unit === "°C·days" || unit === "Degree Days" || unit === "MHU") {
    return `${sign}${Math.round(change).toLocaleString()} ${unit}`;
  }
  return `${sign}${Math.round(change)} ${unit}`;
};
