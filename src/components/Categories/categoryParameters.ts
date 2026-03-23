// Parameter definitions for each climate variable category
// Based on Canada Climate Atlas structure

import type { Category } from "./CategoryTabs";
import {
  DERIVED_CLIMATE_VARIABLES,
  isDerivedClimateVariable,
} from "../../utils/derivedClimate";

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

const TEMPERATURE_PARAMETERS: Parameter[] = [
  {
    id: "mean_temp_annual",
    label: "Average Annual Temperature",
    infoId: "mean_temp",
    isSelectable: true,
    description: "Average Annual Temperature",
    variableId: "annual_mean_temp",
  },
  {
    id: "mean_temp_apr_may_jun",
    label: "Average Apr-May-Jun Temperature",
    isSelectable: true,
    infoId: "mean_temp",
    description: "Average Apr-May-Jun Temperature",
    variableId: "mean_temp_apr_may_jun",
  },
  {
    id: "mean_temp_jul_aug_sep",
    label: "Average Jul-Aug-Sep Temperature",
    isSelectable: true,
    infoId: "mean_temp",
    description: "Average Jul-Aug-Sep Temperature",
    variableId: "mean_temp_jul_aug_sep",
  },
  {
    id: "mean_temp_sep_oct_nov",
    label: "Average Sep-Oct-Nov Temperature",
    isSelectable: true,
    infoId: "mean_temp",
    description: "Average Sep-Oct-Nov Temperature",
    variableId: "mean_temp_sep_oct_nov",
  },
  {
    id: "mean_temp_dec_jan_feb",
    label: "Average Dec-Jan-Feb Temperature",
    isSelectable: true,
    infoId: "mean_temp",
    description: "Average Dec-Jan-Feb Temperature",
    variableId: "mean_temp_dry_season",
  },
];

const PRECIPITATION_PARAMETERS: Parameter[] = [
  {
    id: "precipitation_annual",
    label: "Total Annual Rainfall",
    isSelectable: true,
    infoId: "annual_precipitation",
    description: "Total Annual Rainfall",
    variableId: "annual_precipitation",
  },
  {
    id: "precipitation_apr_may_jun",
    label: "Total Apr-May-Jun Rainfall",
    isSelectable: true,
    infoId: "wet_season_precipitation",
    description: "Total Apr-May-Jun Rainfall",
    variableId: "precipitation_apr_may_jun",
  },
  {
    id: "precipitation_jul_aug_sep",
    label: "Total Jul-Aug-Sep Rainfall",
    isSelectable: true,
    infoId: "wet_season_precipitation",
    description: "Total Jul-Aug-Sep Rainfall",
    variableId: "precipitation_jul_aug_sep",
  },
  {
    id: "precipitation_sep_oct_nov",
    label: "Total Sep-Oct-Nov Rainfall",
    isSelectable: true,
    infoId: "wet_season_precipitation",
    description: "Total Sep-Oct-Nov Rainfall",
    variableId: "precipitation_sep_oct_nov",
  },
  {
    id: "precipitation_dec_jan_feb",
    label: "Total Dec-Jan-Feb Rainfall",
    isSelectable: true,
    infoId: "annual_precipitation",
    description: "Total Dec-Jan-Feb Rainfall",
    variableId: "precipitation_dec_jan_feb",
  },
];

export const CATEGORY_PARAMETERS: Record<Category, Parameter[]> = {
  precipitation: PRECIPITATION_PARAMETERS,
  temperature: TEMPERATURE_PARAMETERS,
  sea_level: [
    {
      id: "sea_level_rise",
      label: "Sea Level Rise",
      description: "Projected relative sea-level rise affecting coastal systems and low-lying districts",
    },
    {
      id: "storm_surge_flood_risk",
      label: "Storm Surge Flood Risk",
      description: "Coastal flood-risk index with low-magnitude inland proxy values for indirect relevance",
    },
    {
      id: "coastal_erosion_risk",
      label: "Coastal Erosion Risk",
      description: "Shoreline erosion risk with inland proxy values shown only for contextual continuity",
    },
    {
      id: "saltwater_intrusion_risk",
      label: "Saltwater Intrusion Risk",
      description: "Risk of saline intrusion into coastal and connected inland water systems",
    },
  ],
};

export const CATEGORY_COLORS: Record<Category, string> = {
  precipitation: "#0891b2",
  temperature: "#ea580c",
  sea_level: "#0f766e",
};

// Maps frontend parameter IDs to backend variables or valid derived sources.
export const PARAMETER_TO_VARIABLE: Record<string, string> = {
  // Temperature
  mean_temp_annual: "annual_mean_temp",
  mean_temp_apr_may_jun: "mean_temp_apr_may_jun",
  mean_temp_jul_aug_sep: "mean_temp_jul_aug_sep",
  mean_temp_sep_oct_nov: "mean_temp_sep_oct_nov",
  mean_temp_dec_jan_feb: "mean_temp_dry_season",

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
  precipitation_apr_may_jun: "precipitation_apr_may_jun",
  precipitation_jul_aug_sep: "precipitation_jul_aug_sep",
  precipitation_sep_oct_nov: "precipitation_sep_oct_nov",
  precipitation_dec_jan_feb: "precipitation_dec_jan_feb",

  // Sea Level
  sea_level_rise: "sea_level_rise",
  storm_surge_flood_risk: "storm_surge_flood_risk",
  coastal_erosion_risk: "coastal_erosion_risk",
  saltwater_intrusion_risk: "saltwater_intrusion_risk",

  // Agriculture
  maize_heat_units: "maize_heat_units",
  gdd_base_5: "gdd_base_5",
  gdd_base_10: "gdd_base_10",
  gdd_base_15: "gdd_base_15",
  gdd_base_4: "gdd_base_4",
};

export const CATEGORY_DEFAULT_VARIABLE: Record<Category, string> = {
  temperature: "annual_mean_temp",
  precipitation: "annual_precipitation",
  sea_level: "sea_level_rise",
};

export const getCategoryLabel = (category: Category): string => {
  const labels: Record<Category, string> = {
    precipitation: "RAINFALL",
    temperature: "TEMPERATURE",
    sea_level: "SEA LEVEL",
  };
  return labels[category];
};

export const getParameterVariableId = (parameterId: string): string | undefined => {
  const mappedVariableId = PARAMETER_TO_VARIABLE[parameterId];
  if (mappedVariableId) {
    return mappedVariableId;
  }

  if (isDerivedClimateVariable(parameterId)) {
    return parameterId;
  }

  return undefined;
};

export const hasDerivedVariableSources = (parameterId: string, availableVariableIds: Set<string>): boolean => {
  const definition = DERIVED_CLIMATE_VARIABLES[parameterId];
  if (!definition) {
    return false;
  }

  return definition.sourceVariableIds.every((variableId) => availableVariableIds.has(variableId));
};
