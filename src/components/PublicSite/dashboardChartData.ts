import type { ClimateTimeSeriesPoint } from "../../types/climate";

const SEA_LEVEL_MILESTONE_YEARS = [1991, 2020, 2030, 2050, 2080, 2100];

export const selectSeaLevelMilestones = (
  data: ClimateTimeSeriesPoint[],
  maximumPoints = 6,
): ClimateTimeSeriesPoint[] => {
  if (data.length <= maximumPoints) return data;

  const pointsByYear = new Map(data.map((point) => [point.year, point]));
  const selected = new Map<number, ClimateTimeSeriesPoint>();
  const addPoint = (point: ClimateTimeSeriesPoint | undefined) => {
    if (point) selected.set(point.year, point);
  };

  addPoint(data[0]);
  addPoint(data[data.length - 1]);
  SEA_LEVEL_MILESTONE_YEARS.forEach((year) => addPoint(pointsByYear.get(year)));

  const targetCount = Math.min(maximumPoints, data.length);
  for (let index = 0; index < targetCount && selected.size < targetCount; index += 1) {
    const dataIndex = Math.round(index * (data.length - 1) / (targetCount - 1));
    addPoint(data[dataIndex]);
  }

  return [...selected.values()]
    .sort((left, right) => left.year - right.year)
    .slice(0, maximumPoints);
};
