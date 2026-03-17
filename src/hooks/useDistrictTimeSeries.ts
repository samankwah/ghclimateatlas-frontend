// Hook to fetch time series data for a single district across all periods

import { useQueries } from "@tanstack/react-query";
import { fetchClimateData, fetchClimateComparison } from "../api/climate";
import type {
  ClimateComparisonResponse,
  ClimateResponse,
  Scenario,
  Period,
} from "../types/climate";
import {
  aggregateClimateComparisonResponses,
  aggregateClimateDataResponses,
  getDerivedClimateVariable,
} from "../utils/derivedClimate";

export interface TimeSeriesPoint {
  period: Period;
  year: number;
  value: number;
  label: string;
  low: number;
  median: number;
  high: number;
}

export interface DistrictStatistics {
  baseline: { low: number; median: number; high: number };
  future: { low: number; median: number; high: number };
  gridPointCount: number;
}

interface UseDistrictTimeSeriesResult {
  data: TimeSeriesPoint[];
  statistics: DistrictStatistics | null;
  isLoading: boolean;
  error: Error | null;
}

const PERIOD_CONFIG: { period: Period; year: number; label: string }[] = [
  { period: "baseline", year: 2005, label: "Baseline" },
  { period: "2030", year: 2035, label: "2030s" },
  { period: "2050", year: 2065, label: "2050s" },
  { period: "2080", year: 2080, label: "2080s" },
];

// Estimate uncertainty range based on change percentage
// This provides a visual representation of variability
const calculateUncertaintyRange = (
  value: number,
  changePercent: number = 0
): { low: number; median: number; high: number } => {
  // Use change percent to estimate uncertainty band width
  // Larger changes typically have more uncertainty
  const uncertaintyFactor = Math.max(0.05, Math.abs(changePercent) * 0.01);
  const range = value * uncertaintyFactor;

  return {
    low: value - range,
    median: value,
    high: value + range,
  };
};

export const useDistrictTimeSeries = (
  districtId: string | null,
  variable: string,
  scenario: Scenario,
  selectedPeriod: Period = "2080"
): UseDistrictTimeSeriesResult => {
  const definition = getDerivedClimateVariable(variable);
  const sourceVariableIds = definition?.sourceVariableIds ?? [variable];

  // Fetch baseline data
  const baselineQuery = useQueries({
    queries: sourceVariableIds.map((sourceVariableId) => ({
        queryKey: ["district-baseline", variable, sourceVariableId, districtId],
        queryFn: () => fetchClimateData(sourceVariableId, "baseline", scenario),
        enabled: !!districtId && !!variable,
        staleTime: 5 * 60 * 1000,
      })),
  });

  // Fetch comparison data for future periods
  const comparisonQueries = useQueries({
    queries: PERIOD_CONFIG
      .filter((p) => p.period !== "baseline")
      .flatMap((p) => sourceVariableIds.map((sourceVariableId) => ({
      queryKey: ["district-comparison", variable, sourceVariableId, p.period, scenario, districtId],
      queryFn: () => fetchClimateComparison(sourceVariableId, p.period, scenario),
      enabled: !!districtId && !!variable,
      staleTime: 5 * 60 * 1000,
    }))),
  });

  const isLoading =
    baselineQuery.some((q) => q.isLoading) ||
    comparisonQueries.some((q) => q.isLoading);

  const error =
    baselineQuery.find((q) => q.error)?.error ||
    comparisonQueries.find((q) => q.error)?.error ||
    null;

  // Build time series data
  const data: TimeSeriesPoint[] = [];
  let statistics: DistrictStatistics | null = null;
  const isClimateResponse = (response: ClimateResponse | undefined): response is ClimateResponse =>
    response !== undefined;
  const isClimateComparisonResponse = (
    response: ClimateComparisonResponse | undefined,
  ): response is ClimateComparisonResponse => response !== undefined;

  if (!isLoading && !error && districtId) {
    const baselineData = definition
      ? aggregateClimateDataResponses(
          definition,
          baselineQuery.map((query) => query.data).filter(isClimateResponse),
          "baseline",
          scenario,
        )
      : baselineQuery[0]?.data;
    const districtBaseline = baselineData?.data.find(
      (d) => d.district_id === districtId
    );

    if (districtBaseline) {
      // Baseline point
      const baselineUncertainty = calculateUncertaintyRange(districtBaseline.value, 5);
      data.push({
        period: "baseline",
        year: PERIOD_CONFIG[0].year,
        value: districtBaseline.value,
        label: PERIOD_CONFIG[0].label,
        ...baselineUncertainty,
      });

      // Future periods from comparison data
      let selectedFutureStats: { low: number; median: number; high: number } | null = null;

      PERIOD_CONFIG.slice(1).forEach((config, index) => {
        const comparisonData = definition
          ? aggregateClimateComparisonResponses(
              definition,
              sourceVariableIds
                .map((_, sourceIndex) => comparisonQueries[index * sourceVariableIds.length + sourceIndex]?.data)
                .filter(isClimateComparisonResponse),
              config.period,
              scenario,
            )
          : comparisonQueries[index]?.data;
        const districtComparison = comparisonData?.data.find(
          (d) => d.district_id === districtId
        );

        if (districtComparison) {
          const uncertainty = calculateUncertaintyRange(
            districtComparison.future,
            districtComparison.change_percent
          );

          data.push({
            period: config.period,
            year: config.year,
            value: districtComparison.future,
            label: config.label,
            ...uncertainty,
          });

          if (config.period === selectedPeriod) {
            selectedFutureStats = uncertainty;
          }
        }
      });

      // Build statistics object
      if (selectedFutureStats) {
        statistics = {
          baseline: baselineUncertainty,
          future: selectedFutureStats,
          // Estimate grid points based on typical district size
          // Ghana has ~261 districts, ~238,533 km², average ~914 km² per district
          // At 0.05° resolution (~5.5km), roughly 30-40 grid points per district
          gridPointCount: 35,
        };
      }
    }
  }

  return {
    data,
    statistics,
    isLoading,
    error: error as Error | null,
  };
};
