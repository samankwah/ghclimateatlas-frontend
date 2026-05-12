// API client for Ghana Climate Atlas backend

import axios from "axios";
import type {
  DistrictFeatureCollection,
  ClimateVariable,
  ClimateResponse,
  ClimateComparisonResponse,
  ClimateTimeSeriesResponse,
  RegionInfo,
  DistrictClimate,
  Period,
  Scenario,
} from "../types/climate";

const PRODUCTION_API_BASE = "https://atlas.meteo.gov.gh/api";
const SAME_ORIGIN_API_BASE = "/api";
const LEGACY_API_HOSTS = new Set([
  "ghana-climate-atlas-api.onrender.com",
  "ghclimateatlas-backend.vercel.app",
]);

const normalizeApiBase = (value?: string) => {
  const candidate = value?.trim();
  if (!candidate) {
    return null;
  }

  try {
    const url = new URL(candidate);
    if (LEGACY_API_HOSTS.has(url.hostname)) {
      if (typeof window !== "undefined" && window.location.hostname.endsWith(".netlify.app")) {
        return SAME_ORIGIN_API_BASE;
      }
      return PRODUCTION_API_BASE;
    }
    return url.toString().replace(/\/$/, "");
  } catch {
    return candidate.replace(/\/$/, "");
  }
};

const getDefaultApiBase = () => {
  if (typeof window !== "undefined") {
    const hostname = window.location.hostname;
    const isLocalHost =
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname === "0.0.0.0";

    if (isLocalHost) {
      return "http://127.0.0.1:8001/api";
    }

    // Netlify deploys: call the same-origin redirect in netlify.toml.
    if (hostname.endsWith(".netlify.app")) {
      return SAME_ORIGIN_API_BASE;
    }
  }

  // Same-origin fallback for reverse-proxy deployments (e.g. atlas.meteo.gov.gh)
  return SAME_ORIGIN_API_BASE;
};

export const API_BASE =
  normalizeApiBase(import.meta.env.VITE_API_URL) || getDefaultApiBase();

const api = axios.create({
  baseURL: API_BASE,
  timeout: 60000,
});

if (import.meta.env.DEV) {
  console.info(`[climate-api] Using backend: ${API_BASE}`);
}

// Districts API
export const fetchDistricts = async (): Promise<DistrictFeatureCollection> => {
  const response = await api.get<DistrictFeatureCollection>("/districts");
  return response.data;
};

export const fetchMapDistricts = async (): Promise<DistrictFeatureCollection> => {
  const response = await api.get<DistrictFeatureCollection>("/districts/map");
  return response.data;
};

export const fetchRegions = async (): Promise<RegionInfo[]> => {
  const response = await api.get<RegionInfo[]>("/districts/regions");
  return response.data;
};

export const fetchDistrictClimate = async (
  districtId: string,
  variable: string,
  period: Period,
  scenario: Scenario,
  percentile: "p10" | "p50" | "p90" = "p50",
): Promise<DistrictClimate> => {
  const response = await api.get<DistrictClimate>(`/districts/${districtId}/climate`, {
    params: { variable, period, scenario, percentile },
  });
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

export const fetchDistrictClimateTimeseries = async (
  districtId: string,
  variable: string,
  scenario: Scenario,
): Promise<ClimateTimeSeriesResponse> => {
  const response = await api.get<ClimateTimeSeriesResponse>(`/climate/${variable}/timeseries`, {
    params: { district_id: districtId, scenario },
  });
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
