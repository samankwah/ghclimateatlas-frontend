// Custom hooks for climate data fetching

import { useQuery, keepPreviousData } from "@tanstack/react-query";
import {
  fetchDistricts,
  fetchClimateVariables,
  fetchClimateData,
  fetchClimateComparison,
  fetchClimateRange,
} from "../api/climate";
import type { Period, Scenario } from "../types/climate";

// Fetch all districts with GeoJSON geometry
export const useDistricts = () => {
  return useQuery({
    queryKey: ["districts"],
    queryFn: fetchDistricts,
    staleTime: Infinity, // Districts don't change
  });
};

// Fetch climate variables metadata
export const useClimateVariables = () => {
  return useQuery({
    queryKey: ["climate-variables"],
    queryFn: fetchClimateVariables,
    staleTime: Infinity,
  });
};

// Fetch climate data for a specific variable, period, and scenario
export const useClimateData = (
  variable: string,
  period: Period,
  scenario: Scenario
) => {
  return useQuery({
    queryKey: ["climate-data", variable, period, scenario],
    queryFn: () => fetchClimateData(variable, period, scenario),
    enabled: !!variable,
    staleTime: 5 * 60 * 1000,
    placeholderData: keepPreviousData,
  });
};

// Fetch climate comparison (baseline vs future)
export const useClimateComparison = (
  variable: string,
  period: Period,
  scenario: Scenario
) => {
  return useQuery({
    queryKey: ["climate-comparison", variable, period, scenario],
    queryFn: () => fetchClimateComparison(variable, period, scenario),
    enabled: !!variable && period !== "baseline",
    staleTime: 5 * 60 * 1000,
  });
};

// Fetch min/max range for a variable
export const useClimateRange = (
  variable: string,
  period: Period,
  scenario: Scenario
) => {
  return useQuery({
    queryKey: ["climate-range", variable, period, scenario],
    queryFn: () => fetchClimateRange(variable, period, scenario),
    enabled: !!variable,
    staleTime: 5 * 60 * 1000,
    placeholderData: keepPreviousData,
  });
};
