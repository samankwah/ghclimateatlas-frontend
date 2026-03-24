// Custom hooks for climate data fetching

import { useMemo } from "react";
import { keepPreviousData, useQueries, useQuery } from "@tanstack/react-query";
import {
  fetchMapDistricts,
  fetchClimateVariables,
  fetchClimateData,
  fetchClimateComparison,
} from "../api/climate";
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

const getSourceVariableIds = (variable: string): string[] =>
  getDerivedClimateVariable(variable)?.sourceVariableIds ?? [variable];

const getClimateQueryKey = (
  prefix: string,
  variable: string,
  period: Period,
  scenario: Scenario,
  sourceVariableId?: string,
) => [prefix, variable, period, scenario, sourceVariableId ?? variable];

const allQueriesSucceeded = (
  results: Array<{ data?: unknown; isSuccess: boolean }>,
): boolean => results.length > 0 && results.every((result) => result.isSuccess && !!result.data);

// Fetch all districts with GeoJSON geometry
export const useDistricts = () => {
  return useQuery({
    queryKey: ["districts"],
    queryFn: fetchMapDistricts,
    staleTime: Infinity,
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
  scenario: Scenario,
) => {
  const definition = getDerivedClimateVariable(variable);
  const sourceVariableIds = getSourceVariableIds(variable);
  const queryResults = useQueries({
    queries: sourceVariableIds.map((sourceVariableId) => ({
      queryKey: getClimateQueryKey("climate-data", variable, period, scenario, sourceVariableId),
      queryFn: () => fetchClimateData(sourceVariableId, period, scenario),
      enabled: !!variable,
      staleTime: 5 * 60 * 1000,
      placeholderData: keepPreviousData,
    })),
  });

  const data = useMemo<ClimateResponse | undefined>(() => {
    if (!allQueriesSucceeded(queryResults)) {
      return undefined;
    }

    if (!definition) {
      return queryResults[0]?.data as ClimateResponse | undefined;
    }

    return aggregateClimateDataResponses(
      definition,
      queryResults.map((result) => result.data as ClimateResponse),
      period,
      scenario,
    );
  }, [definition, period, queryResults, scenario]);

  return {
    data,
    isLoading: queryResults.some((result) => result.isLoading),
    isFetching: queryResults.some((result) => result.isFetching),
    error: queryResults.find((result) => result.error)?.error ?? null,
  };
};

// Fetch climate comparison (baseline vs future)
export const useClimateComparison = (
  variable: string,
  period: Period,
  scenario: Scenario,
) => {
  const definition = getDerivedClimateVariable(variable);
  const sourceVariableIds = getSourceVariableIds(variable);
  const queryResults = useQueries({
    queries: sourceVariableIds.map((sourceVariableId) => ({
      queryKey: getClimateQueryKey("climate-comparison", variable, period, scenario, sourceVariableId),
      queryFn: () => fetchClimateComparison(sourceVariableId, period, scenario),
      enabled: !!variable && period !== "baseline",
      staleTime: 5 * 60 * 1000,
      placeholderData: keepPreviousData,
    })),
  });

  const data = useMemo<ClimateComparisonResponse | undefined>(() => {
    if (period === "baseline" || !allQueriesSucceeded(queryResults)) {
      return undefined;
    }

    if (!definition) {
      return queryResults[0]?.data as ClimateComparisonResponse | undefined;
    }

    return aggregateClimateComparisonResponses(
      definition,
      queryResults.map((result) => result.data as ClimateComparisonResponse),
      period,
      scenario,
    );
  }, [definition, period, queryResults, scenario]);

  return {
    data,
    isLoading: queryResults.some((result) => result.isLoading),
    isFetching: queryResults.some((result) => result.isFetching),
    error: queryResults.find((result) => result.error)?.error ?? null,
  };
};
