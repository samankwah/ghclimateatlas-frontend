// Climate data types for Ghana Climate Atlas

export interface District {
  id: string;
  name: string;
  region: string;
}

export interface DistrictGeoJSON {
  type: "Feature";
  properties: {
    id: string;
    name: string;
    region: string;
    centroid?: [number, number]; // [longitude, latitude]
  };
  geometry: {
    type: "Polygon";
    coordinates: number[][][];
  };
}

export interface DistrictFeatureCollection {
  type: "FeatureCollection";
  features: DistrictGeoJSON[];
}

export interface ClimateVariable {
  id: string;
  name: string;
  description: string;
  unit: string;
  category: "temperature" | "precipitation" | "agriculture" | "sea_level";
  color_scale: string;
}

export interface ClimateValue {
  district_id: string;
  district_name: string;
  value: number;
}

export interface ClimateResponse {
  variable: string;
  variable_name: string;
  period: string;
  scenario: string;
  unit: string;
  percentile?: "p10" | "p50" | "p90";
  data: ClimateValue[];
}

export interface ClimateComparison {
  district_id: string;
  district_name: string;
  baseline: number;
  future: number;
  change: number;
  change_percent: number;
}

export interface ClimateComparisonResponse {
  variable: string;
  variable_name: string;
  period: string;
  scenario: string;
  unit: string;
  percentile?: "p10" | "p50" | "p90";
  data: ClimateComparison[];
}

export interface ClimateTimeSeriesPoint {
  year: number;
  p10: number;
  p50: number;
  p90: number;
}

export interface ClimateTimeSeriesReferencePeriod {
  start: number;
  end: number;
}

export interface ClimateTimeSeriesResponse {
  variable: string;
  variable_name: string;
  scenario: string;
  unit: string;
  district_id: string;
  district_name: string;
  reference_period: ClimateTimeSeriesReferencePeriod;
  reference_mean: number;
  data: ClimateTimeSeriesPoint[];
}

export interface RegionInfo {
  name: string;
  district_count: number;
}

export interface DistrictClimate {
  district_id: string;
  district_name: string;
  region: string;
  climate: Record<string, Record<string, number>>;
  grid_point_count?: number | null;
  grid_resolution_km?: number | null;
}

export type Period = "baseline" | "2030" | "2050" | "2080";
export type Scenario = "rcp26" | "rcp45" | "rcp85" | "ssp126" | "ssp245" | "ssp585";

export interface MapState {
  variable: string;
  period: Period;
  scenario: Scenario;
  selectedDistrictId: string | null;
  showChange: boolean;
}
