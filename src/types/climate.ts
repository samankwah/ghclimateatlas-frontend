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
  category: "temperature" | "precipitation";
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
  data: ClimateComparison[];
}

export interface RegionInfo {
  name: string;
  district_count: number;
}

export type Period = "baseline" | "2030" | "2050" | "2080";
export type Scenario = "rcp45" | "rcp85";

export interface MapState {
  variable: string;
  period: Period;
  scenario: Scenario;
  selectedDistrictId: string | null;
  showChange: boolean;
}
