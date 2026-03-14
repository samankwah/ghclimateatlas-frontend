// Parameter definitions for each climate variable category
// Based on Canada Climate Atlas structure

import type { Category } from "./CategoryTabs";

export interface Parameter {
  id: string;
  label: string;
  description?: string;
  isExpandable?: boolean;
  infoId?: string;
  isSelectable?: boolean;
  disabled?: boolean;
  variableId?: string;
  children?: Parameter[];
}

const MONTH_GROUPS = {
  spring: ["mar", "apr", "may"],
  summer: ["jun", "jul", "aug"],
  fall: ["sep", "oct", "nov"],
  winter: ["dec", "jan", "feb"],
} as const;

const buildMonthChildren = (
  parameterPrefix: string,
  variablePrefix: string,
  season: keyof typeof MONTH_GROUPS,
): Parameter[] =>
  MONTH_GROUPS[season].map((month) => ({
    id: `${parameterPrefix}_${season}_${month}`,
    label: `${month.charAt(0).toUpperCase()}${month.slice(1)}`,
    isSelectable: true,
    variableId: `${variablePrefix}_${month}`,
  }));

const buildTemperatureSubmenu = (
  prefix: string,
  annualLabel: string,
  infoId: string,
): Parameter[] => [
  {
    id: `${prefix}_annual`,
    label: "Annual",
    infoId,
    isSelectable: true,
    description: annualLabel,
    variableId:
      prefix === "mean_temp"
        ? "annual_mean_temp"
        : prefix === "max_temp"
          ? "annual_max_temp"
          : "annual_min_temp",
  },
  {
    id: `${prefix}_spring`,
    label: "Major South",
    isSelectable: true,
    infoId,
    variableId: `${prefix}_major_south`,
    children: buildMonthChildren(prefix, prefix, "spring"),
  },
  {
    id: `${prefix}_summer`,
    label: "Major North",
    isSelectable: true,
    infoId,
    variableId: `${prefix}_major_north`,
    children: buildMonthChildren(prefix, prefix, "summer"),
  },
  {
    id: `${prefix}_fall`,
    label: "Minor South",
    isSelectable: true,
    infoId,
    variableId: `${prefix}_minor_south`,
    children: buildMonthChildren(prefix, prefix, "fall"),
  },
  {
    id: `${prefix}_winter`,
    label: "Dry Season",
    isSelectable: true,
    infoId,
    variableId: `${prefix}_dry_season`,
    children: buildMonthChildren(prefix, prefix, "winter"),
  },
];

const buildPrecipitationSubmenu = (): Parameter[] => [
  {
    id: "precipitation_annual",
    label: "Annual",
    isSelectable: true,
    infoId: "annual_precipitation",
    description: "Annual precipitation",
    variableId: "annual_precipitation",
  },
  {
    id: "precipitation_spring",
    label: "Major South",
    isSelectable: true,
    infoId: "wet_season_precipitation",
    variableId: "precipitation_major_south",
    children: buildMonthChildren("precipitation", "precipitation", "spring"),
  },
  {
    id: "precipitation_summer",
    label: "Major North",
    isSelectable: true,
    infoId: "wet_season_precipitation",
    variableId: "precipitation_major_north",
    children: buildMonthChildren("precipitation", "precipitation", "summer"),
  },
  {
    id: "precipitation_fall",
    label: "Minor South",
    isSelectable: true,
    infoId: "wet_season_precipitation",
    variableId: "precipitation_minor_south",
    children: buildMonthChildren("precipitation", "precipitation", "fall"),
  },
  {
    id: "precipitation_winter",
    label: "Dry Season",
    isSelectable: true,
    infoId: "annual_precipitation",
    variableId: "precipitation_dry_season",
    children: buildMonthChildren("precipitation", "precipitation", "winter"),
  },
  {
    id: "precipitation_growing_season",
    label: "Growing season",
    isSelectable: true,
    infoId: "wet_season_precipitation",
    variableId: "precipitation_growing_season",
  },
];

export const CATEGORY_PARAMETERS: Record<Category, Parameter[]> = {
  precipitation: [
    {
      id: "precipitation_total",
      label: "Precipitation",
      description: "Total precipitation amounts by annual and seasonal periods",
      isExpandable: true,
      disabled: false,
      children: buildPrecipitationSubmenu(),
    },
    { id: "heavy_precip_10mm", label: "Heavy Precipitation Days (10 mm)", description: "Days per year with rainfall exceeding 10 mm" },
    { id: "heavy_precip_20mm", label: "Heavy Precipitation Days (20 mm)", description: "Days per year with rainfall exceeding 20 mm" },
    { id: "wet_days", label: "Wet Days", description: "Total days per year with measurable precipitation" },
    { id: "dry_days", label: "Dry Days", description: "Total days per year with no measurable precipitation" },
    { id: "max_1day_precip", label: "Max 1-Day Precipitation", description: "Highest single-day rainfall total in the year" },
    { id: "max_3day_precip", label: "Max 3-Day Precipitation", description: "Highest 3-day cumulative rainfall in the year" },
    { id: "max_5day_precip", label: "Max 5-Day Precipitation", description: "Highest 5-day cumulative rainfall in the year" },
  ],
  agriculture: [
    { id: "maize_heat_units", label: "Maize Heat Units", description: "Crop-specific heat units for maize development in warm Ghanaian conditions" },
    { id: "gdd_base_10", label: "Growing Degree Days (Base 10C)", description: "Standard warm-season heat accumulation indicator for crops like maize and rice" },
    { id: "gdd_base_15", label: "Growing Degree Days (Base 15C)", description: "Higher-threshold heat accumulation for more heat-demanding tropical crops" },
    { id: "gdd_base_5", label: "Growing Degree Days (Base 5C)", description: "Lower-threshold comparison metric; not the usual Ghana warm-season crop standard" },
    { id: "gdd_base_4", label: "Growing Degree Days (Base 4C)", description: "Very low-threshold comparison metric; mainly useful for cross-climate comparison" },
  ],
  hot_weather: [
    { id: "very_hot_days_30", label: "Very Hot Days", description: "Days per year when the maximum temperature exceeds 35 C", infoId: "very_hot_days_35" },
    { id: "warmest_max_temp", label: "Warmest Maximum Temperature", description: "Highest recorded daily maximum temperature in the year" },
    { id: "heat_wave_count", label: "Number of Heat Waves", description: "Count of heat-wave events per year (3+ consecutive hot days)" },
    { id: "heat_wave_avg_length", label: "Average Length of Heat Waves", description: "Mean duration in days of heat-wave events" },
    { id: "longest_hot_spell", label: "Longest Spell of +30 C Days", description: "Maximum consecutive days above 30 C in a year" },
    { id: "hot_season", label: "Hot (+30 C) Season", description: "Duration of the season when daily highs regularly exceed 30 C" },
    { id: "extreme_hot_32", label: "Extremely Hot Days (+32 C)", description: "Days per year when the maximum temperature exceeds 32 C" },
    { id: "extreme_hot_34", label: "Extremely Hot Days (+34 C)", description: "Days per year when the maximum temperature exceeds 34 C" },
  ],
  temperature: [
    {
      id: "mean_temp",
      label: "Mean Temperature",
      description: "Average of daily mean temperatures over the year",
      isExpandable: true,
      children: buildTemperatureSubmenu("mean_temp", "Annual Mean Temperature", "mean_temp"),
    },
    {
      id: "max_temp",
      label: "Maximum Temperature",
      description: "Average of daily maximum temperatures over the year",
      isExpandable: true,
      children: buildTemperatureSubmenu("max_temp", "Annual Maximum Temperature", "max_temp"),
    },
    {
      id: "min_temp",
      label: "Minimum Temperature",
      description: "Average of daily minimum temperatures over the year",
      isExpandable: true,
      children: buildTemperatureSubmenu("min_temp", "Annual Minimum Temperature", "min_temp"),
    },
  ],
  cold_weather: [
    { id: "coldest_min_temp", label: "Coldest Minimum Temperature", description: "Lowest recorded daily minimum temperature in the year" },
  ],
};

export const CATEGORY_COLORS: Record<Category, string> = {
  precipitation: "#0891b2",
  agriculture: "#65a30d",
  hot_weather: "#d97706",
  temperature: "#ea580c",
  cold_weather: "#0284c7",
};

// Maps frontend parameter IDs to backend variables or valid derived sources.
export const PARAMETER_TO_VARIABLE: Record<string, string> = {
  // Temperature
  mean_temp: "annual_mean_temp",
  max_temp: "annual_max_temp",
  min_temp: "annual_min_temp",
  mean_temp_annual: "annual_mean_temp",
  max_temp_annual: "annual_max_temp",
  min_temp_annual: "annual_min_temp",
  mean_temp_spring: "mean_temp_major_south",
  mean_temp_summer: "mean_temp_major_north",
  mean_temp_fall: "mean_temp_minor_south",
  mean_temp_winter: "mean_temp_dry_season",
  max_temp_spring: "max_temp_major_south",
  max_temp_summer: "max_temp_major_north",
  max_temp_fall: "max_temp_minor_south",
  max_temp_winter: "max_temp_dry_season",
  min_temp_spring: "min_temp_major_south",
  min_temp_summer: "min_temp_major_north",
  min_temp_fall: "min_temp_minor_south",
  min_temp_winter: "min_temp_dry_season",
  mean_temp_spring_mar: "mean_temp_mar",
  mean_temp_spring_apr: "mean_temp_apr",
  mean_temp_spring_may: "mean_temp_may",
  mean_temp_summer_jun: "mean_temp_jun",
  mean_temp_summer_jul: "mean_temp_jul",
  mean_temp_summer_aug: "mean_temp_aug",
  mean_temp_fall_sep: "mean_temp_sep",
  mean_temp_fall_oct: "mean_temp_oct",
  mean_temp_fall_nov: "mean_temp_nov",
  mean_temp_winter_dec: "mean_temp_dec",
  mean_temp_winter_jan: "mean_temp_jan",
  mean_temp_winter_feb: "mean_temp_feb",
  max_temp_spring_mar: "max_temp_mar",
  max_temp_spring_apr: "max_temp_apr",
  max_temp_spring_may: "max_temp_may",
  max_temp_summer_jun: "max_temp_jun",
  max_temp_summer_jul: "max_temp_jul",
  max_temp_summer_aug: "max_temp_aug",
  max_temp_fall_sep: "max_temp_sep",
  max_temp_fall_oct: "max_temp_oct",
  max_temp_fall_nov: "max_temp_nov",
  max_temp_winter_dec: "max_temp_dec",
  max_temp_winter_jan: "max_temp_jan",
  max_temp_winter_feb: "max_temp_feb",
  min_temp_spring_mar: "min_temp_mar",
  min_temp_spring_apr: "min_temp_apr",
  min_temp_spring_may: "min_temp_may",
  min_temp_summer_jun: "min_temp_jun",
  min_temp_summer_jul: "min_temp_jul",
  min_temp_summer_aug: "min_temp_aug",
  min_temp_fall_sep: "min_temp_sep",
  min_temp_fall_oct: "min_temp_oct",
  min_temp_fall_nov: "min_temp_nov",
  min_temp_winter_dec: "min_temp_dec",
  min_temp_winter_jan: "min_temp_jan",
  min_temp_winter_feb: "min_temp_feb",

  // Hot Weather
  very_hot_days_30: "very_hot_days",
  warmest_max_temp: "warmest_max_temp",
  heat_wave_count: "heat_wave_count",
  heat_wave_avg_length: "heat_wave_avg_length",
  longest_hot_spell: "longest_hot_spell",
  hot_season: "hot_season",
  extreme_hot_32: "extreme_hot_32",
  extreme_hot_34: "extreme_hot_34",

  // Cold Weather
  coldest_min_temp: "coldest_min_temp",

  // Precipitation
  precipitation_annual: "annual_precipitation",
  precipitation_spring: "precipitation_major_south",
  precipitation_summer: "precipitation_major_north",
  precipitation_fall: "precipitation_minor_south",
  precipitation_winter: "precipitation_dry_season",
  precipitation_spring_mar: "precipitation_mar",
  precipitation_spring_apr: "precipitation_apr",
  precipitation_spring_may: "precipitation_may",
  precipitation_summer_jun: "precipitation_jun",
  precipitation_summer_jul: "precipitation_jul",
  precipitation_summer_aug: "precipitation_aug",
  precipitation_fall_sep: "precipitation_sep",
  precipitation_fall_oct: "precipitation_oct",
  precipitation_fall_nov: "precipitation_nov",
  precipitation_winter_dec: "precipitation_dec",
  precipitation_winter_jan: "precipitation_jan",
  precipitation_winter_feb: "precipitation_feb",
  precipitation_growing_season: "precipitation_growing_season",
  heavy_precip_10mm: "heavy_precip_10mm",
  heavy_precip_20mm: "heavy_precip_20mm",
  wet_days: "dry_days",
  dry_days: "dry_days",
  max_1day_precip: "max_1day_precip",
  max_3day_precip: "max_3day_precip",
  max_5day_precip: "max_5day_precip",

  // Agriculture
  maize_heat_units: "maize_heat_units",
  gdd_base_5: "gdd_base_5",
  gdd_base_10: "gdd_base_10",
  gdd_base_15: "gdd_base_15",
  gdd_base_4: "gdd_base_4",
};

export const CATEGORY_DEFAULT_VARIABLE: Record<Category, string> = {
  temperature: "annual_max_temp",
  hot_weather: "very_hot_days",
  cold_weather: "annual_min_temp",
  precipitation: "heavy_precip_10mm",
  agriculture: "gdd_base_10",
};

export const getCategoryLabel = (category: Category): string => {
  const labels: Record<Category, string> = {
    precipitation: "PRECIPITATION",
    agriculture: "AGRICULTURE",
    hot_weather: "HOT WEATHER",
    temperature: "TEMPERATURE",
    cold_weather: "COLD WEATHER",
  };
  return labels[category];
};
