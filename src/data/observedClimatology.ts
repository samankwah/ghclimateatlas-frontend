export const CLIMATOLOGY_MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

export type ClimatologyMonth = (typeof CLIMATOLOGY_MONTHS)[number];
export type ClimatologyRegion = "Northern Ghana" | "Southern Ghana";

export interface ObservedClimatologyPoint {
  region: ClimatologyRegion;
  month: ClimatologyMonth;
  rainfallMillimetres: number;
  temperatureCelsius: number;
}

const buildRegion = (
  region: ClimatologyRegion,
  rainfall: readonly number[],
  temperature: readonly number[],
): ObservedClimatologyPoint[] => CLIMATOLOGY_MONTHS.map((month, index) => ({
  region,
  month,
  rainfallMillimetres: rainfall[index] ?? 0,
  temperatureCelsius: temperature[index] ?? 0,
}));

/**
 * Ghana Meteorological Agency 1991–2020 observed climatology, transcribed
 * from the official Ghana Climate Atlas climate overview graphic.
 */
export const OBSERVED_CLIMATOLOGY: Record<"north" | "south", ObservedClimatologyPoint[]> = {
  north: buildRegion(
    "Northern Ghana",
    [3, 8, 28, 75, 116, 143, 169, 209, 200, 98, 9, 2],
    [27.3, 29.8, 31.8, 31.5, 30.0, 27.8, 26.7, 26.2, 26.7, 28.1, 28.8, 27.4],
  ),
  south: buildRegion(
    "Southern Ghana",
    [19, 42, 96, 132, 174, 220, 118, 71, 136, 162, 76, 30],
    [27.3, 28.8, 28.9, 28.5, 27.9, 26.6, 25.8, 25.5, 26.2, 27.0, 27.6, 27.4],
  ),
};

export const OBSERVED_CLIMATOLOGY_SOURCE = {
  label: "Ghana Meteorological Agency, Ghana Climate Atlas (1991–2020 climatology)",
  url: "https://www.meteo.gov.gh/climate-atlas/climate-change/",
} as const;
