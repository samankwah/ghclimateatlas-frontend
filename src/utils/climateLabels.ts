import type { Period, Scenario } from "../types/climate";

export const PERIOD_RANGE_LABELS: Record<Period, string> = {
  baseline: "1991-2020",
  "2030": "2021-2050",
  "2050": "2041-2070",
  "2080": "2051-2080",
};

export const PERIOD_SHORT_LABELS: Record<Period, string> = {
  baseline: "Recent Past",
  "2030": "2030s",
  "2050": "2050s",
  "2080": "2080s",
};

export const SCENARIO_LABELS: Record<Scenario, string> = {
  rcp45: "Low Carbon",
  rcp60: "Medium Carbon",
  rcp85: "High Carbon",
};

export const SCENARIO_DESCRIPTIONS: Record<Scenario, string> = {
  rcp45: "Less climate change",
  rcp60: "Medium climate change",
  rcp85: "More climate change",
};

export const getPeriodRangeLabel = (period: Period): string => PERIOD_RANGE_LABELS[period];

export const getPeriodShortLabel = (period: Period): string => PERIOD_SHORT_LABELS[period];

export const getScenarioLabel = (scenario: Scenario): string => SCENARIO_LABELS[scenario];

export const getScenarioDescription = (scenario: Scenario): string =>
  SCENARIO_DESCRIPTIONS[scenario];
