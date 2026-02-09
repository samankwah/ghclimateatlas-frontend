// Parameter definitions for each climate variable category
// Based on Canada Climate Atlas structure

import type { Category } from './CategoryTabs';

export interface Parameter {
  id: string;
  label: string;
  description?: string;
  isExpandable?: boolean;
  children?: Parameter[];
}

export const CATEGORY_PARAMETERS: Record<Category, Parameter[]> = {
  precipitation: [
    { id: 'heavy_precip_10mm', label: 'Heavy Precipitation Days (10 mm)', description: 'Days per year with rainfall exceeding 10 mm' },
    { id: 'heavy_precip_20mm', label: 'Heavy Precipitation Days (20 mm)', description: 'Days per year with rainfall exceeding 20 mm' },
    { id: 'wet_days', label: 'Wet Days', description: 'Total days per year with measurable precipitation' },
    { id: 'dry_days', label: 'Dry Days', description: 'Total days per year with no measurable precipitation' },
    { id: 'max_1day_precip', label: 'Max 1-Day Precipitation', description: 'Highest single-day rainfall total in the year' },
    { id: 'max_3day_precip', label: 'Max 3-Day Precipitation', description: 'Highest 3-day cumulative rainfall in the year' },
    { id: 'max_5day_precip', label: 'Max 5-Day Precipitation', description: 'Highest 5-day cumulative rainfall in the year' },
  ],
  agriculture: [
    { id: 'maize_heat_units', label: 'Maize Heat Units', description: 'Accumulated heat units for maize crop development' },
    { id: 'gdd_base_5', label: 'Growing Degree Days (Base 5 °C)', description: 'Annual heat accumulation above 5 °C for crop growth' },
    { id: 'gdd_base_10', label: 'Growing Degree Days (Base 10 °C)', description: 'Annual heat accumulation above 10 °C for crop growth' },
    { id: 'gdd_base_15', label: 'Growing Degree Days (Base 15 °C)', description: 'Annual heat accumulation above 15 °C for crop growth' },
    { id: 'gdd_base_4', label: 'Growing Degree Days (Base 4 °C)', description: 'Annual heat accumulation above 4 °C for crop growth' },
  ],
  hot_weather: [
    { id: 'very_hot_days_30', label: 'Very Hot Days (+30°C)', description: 'Days per year when the maximum temperature exceeds 30 °C' },
    { id: 'warmest_max_temp', label: 'Warmest Maximum Temperature', description: 'Highest recorded daily maximum temperature in the year' },
    { id: 'heat_wave_count', label: 'Number of Heat Waves', description: 'Count of heat-wave events per year (3+ consecutive hot days)' },
    { id: 'heat_wave_avg_length', label: 'Average Length of Heat Waves', description: 'Mean duration in days of heat-wave events' },
    { id: 'longest_hot_spell', label: 'Longest Spell of +30 °C Days', description: 'Maximum consecutive days above 30 °C in a year' },
    { id: 'hot_season', label: 'Hot (+30 °C) Season', description: 'Duration of the season when daily highs regularly exceed 30 °C' },
    { id: 'extreme_hot_32', label: 'Extremely Hot Days (+32 °C)', description: 'Days per year when the maximum temperature exceeds 32 °C' },
    { id: 'extreme_hot_34', label: 'Extremely Hot Days (+34 °C)', description: 'Days per year when the maximum temperature exceeds 34 °C' },
  ],
  temperature: [
    { id: 'mean_temp', label: 'Mean Temperature', description: 'Average of daily mean temperatures over the year', isExpandable: true },
    { id: 'max_temp', label: 'Maximum Temperature', description: 'Average of daily maximum temperatures over the year', isExpandable: true },
    { id: 'min_temp', label: 'Minimum Temperature', description: 'Average of daily minimum temperatures over the year', isExpandable: true },
  ],
  cold_weather: [
    { id: 'coldest_min_temp', label: 'Coldest Minimum Temperature', description: 'Lowest recorded daily minimum temperature in the year' },
  ],
};

export const CATEGORY_COLORS: Record<Category, string> = {
  precipitation: '#0891b2', // cyan-600
  agriculture: '#65a30d',   // lime-600
  hot_weather: '#d97706',   // amber-600
  temperature: '#ea580c',   // orange-600
  cold_weather: '#0284c7',  // sky-600
};

// Maps each frontend parameter ID to the closest backend variable ID
export const PARAMETER_TO_VARIABLE: Record<string, string> = {
  // Temperature
  "mean_temp": "annual_mean_temp",
  "max_temp": "annual_max_temp",
  "min_temp": "annual_min_temp",

  // Hot Weather
  "very_hot_days_30": "very_hot_days",
  "warmest_max_temp": "annual_max_temp",
  "heat_wave_count": "very_hot_days",
  "heat_wave_avg_length": "very_hot_days",
  "longest_hot_spell": "very_hot_days",
  "hot_season": "very_hot_days",
  "extreme_hot_32": "very_hot_days",
  "extreme_hot_34": "very_hot_days",

  // Cold Weather
  "coldest_min_temp": "annual_mean_temp",

  // Precipitation
  "heavy_precip_10mm": "annual_precipitation",
  "heavy_precip_20mm": "annual_precipitation",
  "wet_days": "wet_season_precipitation",
  "dry_days": "dry_days",
  "max_1day_precip": "annual_precipitation",
  "max_3day_precip": "annual_precipitation",
  "max_5day_precip": "annual_precipitation",

  // Agriculture (GDD computed on backend from projected temps)
  "maize_heat_units": "maize_heat_units",
  "gdd_base_5": "gdd_base_5",
  "gdd_base_10": "gdd_base_10",
  "gdd_base_15": "gdd_base_15",
  "gdd_base_4": "gdd_base_4",
};

// Default backend variable to show on map when a category tab is clicked
export const CATEGORY_DEFAULT_VARIABLE: Record<Category, string> = {
  temperature: "annual_max_temp",
  hot_weather: "very_hot_days",
  cold_weather: "annual_mean_temp",
  precipitation: "annual_precipitation",
  agriculture: "gdd_base_10",
};

export const getCategoryLabel = (category: Category): string => {
  const labels: Record<Category, string> = {
    precipitation: 'PRECIPITATION',
    agriculture: 'AGRICULTURE',
    hot_weather: 'HOT WEATHER',
    temperature: 'TEMPERATURE',
    cold_weather: 'COLD WEATHER',
  };
  return labels[category];
};
