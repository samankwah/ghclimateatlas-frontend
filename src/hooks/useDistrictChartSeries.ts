import { useQuery } from "@tanstack/react-query";
import { fetchDistrictClimateTimeseries } from "../api/climate";
import type { Scenario } from "../types/climate";

export const districtChartSeriesQueryKey = (
  districtId: string | null,
  variable: string,
  scenario: Scenario,
) => ["district-chart-series", districtId, variable, scenario] as const;

export const useDistrictChartSeries = (
  districtId: string | null,
  variable: string,
  scenario: Scenario,
  enabled = true,
) => {
  const query = useQuery({
    queryKey: districtChartSeriesQueryKey(districtId, variable, scenario),
    queryFn: () => fetchDistrictClimateTimeseries(districtId!, variable, scenario),
    enabled: enabled && !!districtId && !!variable,
    staleTime: 5 * 60 * 1000,
  });

  return {
    series: query.data ?? null,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isRefetching: query.isRefetching,
    isSuccess: query.isSuccess,
    isError: query.isError,
    failureCount: query.failureCount,
    error: (query.error as Error | null) ?? null,
    refetch: query.refetch,
  };
};
