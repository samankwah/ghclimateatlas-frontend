// API client for Ghana Climate Atlas backend

import axios from "axios";
import type {
  DistrictFeatureCollection,
  ClimateVariable,
  ClimateResponse,
  ClimateComparisonResponse,
  RegionInfo,
  Period,
  Scenario,
} from "../types/climate";

const getDefaultApiBase = () => {
  if (typeof window !== "undefined") {
    const hostname = window.location.hostname;
    const isLocalHost =
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname === "0.0.0.0";

    if (isLocalHost) {
      return "http://127.0.0.1:8000/api";
    }
  }

  // Production fallback inferred from the Render service name in backend/render.yaml.
  return "https://ghana-climate-atlas-api.onrender.com/api";
};

const API_BASE = import.meta.env.VITE_API_URL || getDefaultApiBase();

const api = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
});

// Districts API
export const fetchDistricts = async (): Promise<DistrictFeatureCollection> => {
  const response = await api.get<DistrictFeatureCollection>("/districts");
  return response.data;
};

export const fetchRegions = async (): Promise<RegionInfo[]> => {
  const response = await api.get<RegionInfo[]>("/districts/regions");
  return response.data;
};

// Climate API
export const fetchClimateVariables = async (): Promise<ClimateVariable[]> => {
  const response = await api.get<ClimateVariable[]>("/climate/variables");
  return response.data;
};

export const fetchClimateData = async (
  variable: string,
  period: Period,
  scenario: Scenario,
  percentile: "p10" | "p50" | "p90" = "p50",
): Promise<ClimateResponse> => {
  const response = await api.get<ClimateResponse>(`/climate/${variable}`, {
    params: { period, scenario, percentile },
  });
  return response.data;
};

export const fetchClimateComparison = async (
  variable: string,
  period: Period,
  scenario: Scenario,
  percentile: "p10" | "p50" | "p90" = "p50",
): Promise<ClimateComparisonResponse> => {
  const response = await api.get<ClimateComparisonResponse>(
    `/climate/${variable}/compare`,
    {
      params: { period, scenario, percentile },
    }
  );
  return response.data;
};

export const fetchClimateRange = async (
  variable: string,
  period: Period,
  scenario: Scenario,
  percentile: "p10" | "p50" | "p90" = "p50",
): Promise<{ min: number; max: number; mean: number }> => {
  const response = await api.get(`/climate/${variable}/range`, {
    params: { period, scenario, percentile },
  });
  return response.data;
};
