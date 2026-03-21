import { useQueries } from "@tanstack/react-query";
import { fetchClimateComparison, fetchClimateData } from "../api/climate";
import type {
  ClimateComparisonResponse,
  ClimateResponse,
  Period,
  Scenario,
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
const PERCENTILES = ["p10", "p50", "p90"] as const;
type Percentile = (typeof PERCENTILES)[number];

const buildRange = (
  low: number | undefined,
  median: number | undefined,
  high: number | undefined,
): { low: number; median: number; high: number } => ({
  low: low ?? median ?? high ?? 0,
  median: median ?? low ?? high ?? 0,
  high: high ?? median ?? low ?? 0,
});

export const useDistrictTimeSeries = (
  districtId: string | null,
  variable: string,
  scenario: Scenario,
  selectedPeriod: Period = "2080",
): UseDistrictTimeSeriesResult => {
  const definition = getDerivedClimateVariable(variable);
  const sourceVariableIds = definition?.sourceVariableIds ?? [variable];

  const baselineQueries = useQueries({
    queries: PERCENTILES.flatMap((percentile) =>
      sourceVariableIds.map((sourceVariableId) => ({
        queryKey: ["district-baseline", variable, sourceVariableId, districtId, percentile],
        queryFn: () => fetchClimateData(sourceVariableId, "baseline", scenario, percentile),
        enabled: !!districtId && !!variable,
        staleTime: 5 * 60 * 1000,
      })),
    ),
  });

  const comparisonQueries = useQueries({
    queries: PERIOD_CONFIG
      .filter((config) => config.period !== "baseline")
      .flatMap((config) =>
        PERCENTILES.flatMap((percentile) =>
          sourceVariableIds.map((sourceVariableId) => ({
            queryKey: [
              "district-comparison",
              variable,
              sourceVariableId,
              config.period,
              scenario,
              districtId,
              percentile,
            ],
            queryFn: () => fetchClimateComparison(sourceVariableId, config.period, scenario, percentile),
            enabled: !!districtId && !!variable,
            staleTime: 5 * 60 * 1000,
          })),
        ),
      ),
  });

  const isLoading =
    baselineQueries.some((query) => query.isLoading) ||
    comparisonQueries.some((query) => query.isLoading);

  const error =
    baselineQueries.find((query) => query.error)?.error ||
    comparisonQueries.find((query) => query.error)?.error ||
    null;

  const isClimateResponse = (response: ClimateResponse | undefined): response is ClimateResponse =>
    response !== undefined;
  const isClimateComparisonResponse = (
    response: ClimateComparisonResponse | undefined,
  ): response is ClimateComparisonResponse => response !== undefined;

  const getBaselineResponse = (percentile: Percentile): ClimateResponse | undefined => {
    const offset = PERCENTILES.indexOf(percentile) * sourceVariableIds.length;
    const responses = sourceVariableIds
      .map((_, sourceIndex) => baselineQueries[offset + sourceIndex]?.data)
      .filter(isClimateResponse);

    if (!responses.length) {
      return undefined;
    }

    return definition
      ? aggregateClimateDataResponses(definition, responses, "baseline", scenario)
      : responses[0];
  };

  const getComparisonResponse = (
    period: Exclude<Period, "baseline">,
    percentile: Percentile,
  ): ClimateComparisonResponse | undefined => {
    const periodIndex = PERIOD_CONFIG.filter((config) => config.period !== "baseline").findIndex(
      (config) => config.period === period,
    );
    if (periodIndex === -1) {
      return undefined;
    }

    const periodOffset = periodIndex * PERCENTILES.length * sourceVariableIds.length;
    const percentileOffset = PERCENTILES.indexOf(percentile) * sourceVariableIds.length;
    const responses = sourceVariableIds
      .map((_, sourceIndex) => comparisonQueries[periodOffset + percentileOffset + sourceIndex]?.data)
      .filter(isClimateComparisonResponse);

    if (!responses.length) {
      return undefined;
    }

    return definition
      ? aggregateClimateComparisonResponses(definition, responses, period, scenario)
      : responses[0];
  };

  const data: TimeSeriesPoint[] = [];
  let statistics: DistrictStatistics | null = null;

  if (!isLoading && !error && districtId) {
    const baselineLow = getBaselineResponse("p10")?.data.find((entry) => entry.district_id === districtId)?.value;
    const baselineMedian = getBaselineResponse("p50")?.data.find((entry) => entry.district_id === districtId)?.value;
    const baselineHigh = getBaselineResponse("p90")?.data.find((entry) => entry.district_id === districtId)?.value;

    if (baselineLow !== undefined || baselineMedian !== undefined || baselineHigh !== undefined) {
      const baselineRange = buildRange(baselineLow, baselineMedian, baselineHigh);
      data.push({
        period: "baseline",
        year: PERIOD_CONFIG[0].year,
        value: baselineRange.median,
        label: PERIOD_CONFIG[0].label,
        ...baselineRange,
      });

      let selectedFutureStats: { low: number; median: number; high: number } | null = null;

      PERIOD_CONFIG.slice(1).forEach((config) => {
        const period = config.period as Exclude<Period, "baseline">;
        const futureLow = getComparisonResponse(period, "p10")?.data.find(
          (entry) => entry.district_id === districtId,
        )?.future;
        const futureMedian = getComparisonResponse(period, "p50")?.data.find(
          (entry) => entry.district_id === districtId,
        )?.future;
        const futureHigh = getComparisonResponse(period, "p90")?.data.find(
          (entry) => entry.district_id === districtId,
        )?.future;
        if (futureLow === undefined && futureMedian === undefined && futureHigh === undefined) {
          return;
        }

        const futureRange = buildRange(futureLow, futureMedian, futureHigh);

        data.push({
          period,
          year: config.year,
          value: futureRange.median,
          label: config.label,
          ...futureRange,
        });

        if (period === selectedPeriod) {
          selectedFutureStats = futureRange;
        }
      });

      if (selectedFutureStats) {
        statistics = {
          baseline: baselineRange,
          future: selectedFutureStats,
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
