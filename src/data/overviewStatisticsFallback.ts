// Offline snapshot of the Overview highlight statistics for Accra Metropolitan.
//
// Rendered only when the API cannot be reached (a preview deploy with no
// backend, or an outage), and always labelled as a saved copy in the UI so it
// is never mistaken for a live projection. Regenerate from:
//   curl "<api>/climate/annual_mean_temp/timeseries?district_id=GH-GRE-ACCRA&scenario=rcp45"
//   curl "<api>/climate/annual_precipitation/timeseries?district_id=GH-GRE-ACCRA&scenario=rcp45"
//   curl "<api>/climate/sea_level_rise/timeseries?district_id=GH-GRE-ACCRA&scenario=ssp245"
// then apply summarizeLateCenturyProjection() to each response.
//
// Captured 2026-09-01 against the Accra defaults in DASHBOARD_DEFAULTS.

import type { LateCenturyProjectionStatistic, OverviewStatisticKind } from "../utils/overviewStatistics";

const PERIODS = {
  lateEnd: 2100,
  lateStart: 2081,
  referenceEnd: 2020,
  referenceStart: 1991,
} as const;

export const OVERVIEW_STATISTICS_FALLBACK: Partial<
  Record<OverviewStatisticKind, LateCenturyProjectionStatistic>
> = {
  temperature: {
    ...PERIODS,
    absoluteChange: 1.5,
    lateMean: 28.7,
    percentChange: null,
    referenceMean: 27.2,
    unit: "°C",
  },
  rainfall: {
    ...PERIODS,
    absoluteChange: -3.1,
    lateMean: 771.9,
    percentChange: -0.4,
    referenceMean: 775,
    unit: "mm",
  },
  "sea-level": {
    ...PERIODS,
    absoluteChange: 0.51,
    lateMean: 0.51,
    percentChange: null,
    referenceMean: 0,
    unit: "m",
  },
};
