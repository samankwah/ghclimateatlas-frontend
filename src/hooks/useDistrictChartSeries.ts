import { useQuery } from "@tanstack/react-query";
import { fetchDistrictClimateTimeseries } from "../api/climate";
import type { ClimateTimeSeriesResponse, Scenario } from "../types/climate";

interface UseDistrictChartSeriesResult {
  series: ClimateTimeSeriesResponse | null;
  isLoading: boolean;
  error: Error | null;
}

export const useDistrictChartSeries = (
  districtId: string | null,
  variable: string,
  scenario: Scenario,
): UseDistrictChartSeriesResult => {
  const query = useQuery({
    queryKey: ["district-chart-series", districtId, variable, scenario],
    queryFn: () => fetchDistrictClimateTimeseries(districtId!, variable, scenario),
    enabled: !!districtId && !!variable,
    staleTime: 5 * 60 * 1000,
  });

  return {
    series: query.data ?? null,
    isLoading: query.isLoading,
    error: (query.error as Error | null) ?? null,
  };
};
