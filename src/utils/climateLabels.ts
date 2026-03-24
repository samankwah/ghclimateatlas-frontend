import type { Period, Scenario } from "../types/climate";

export const PERIOD_RANGE_LABELS: Record<Period, string> = {
  baseline: "1991-2020",
  "2030": "2021-2040",
  "2050": "2041-2060",
  "2080": "2081-2100",
};

export const PERIOD_SHORT_LABELS: Record<Period, string> = {
  baseline: "Reference",
  "2030": "2030s",
  "2050": "2050s",
  "2080": "2080s",
};

export const RCP_SCENARIOS: Scenario[] = ["rcp26", "rcp45", "rcp85"];
export const SSP_SCENARIOS: Scenario[] = ["ssp126", "ssp245", "ssp585"];
export const SEA_LEVEL_VARIABLE_ID = "sea_level_rise";
export const SEA_LEVEL_DISPLAY_NAME = "Average Annual Sea Level";

export const SCENARIO_LABELS: Record<Scenario, string> = {
  rcp26: "Low Emission",
  rcp45: "Medium Emission",
  rcp85: "High Emission",
  ssp126: "SSP126",
  ssp245: "SSP245",
  ssp585: "SSP585",
};

export const SCENARIO_DESCRIPTIONS: Record<Scenario, string> = {
  rcp26: "Less Climate Change",
  rcp45: "Moderate Climate Change",
  rcp85: "More Climate Change",
  ssp126: "Shared Socioeconomic Pathway 1-2.6",
  ssp245: "Shared Socioeconomic Pathway 2-4.5",
  ssp585: "Shared Socioeconomic Pathway 5-8.5",
};

export const SCENARIO_PANEL_LABELS: Record<Scenario, string> = {
  rcp26: "Low Emissions Scenario",
  rcp45: "Medium Emissions Scenario",
  rcp85: "High Emissions Scenario",
  ssp126: "Low Emissions Scenario",
  ssp245: "Medium Emissions Scenario",
  ssp585: "High Emissions Scenario",
};

const RCP_TO_SSP: Record<"rcp26" | "rcp45" | "rcp85", "ssp126" | "ssp245" | "ssp585"> = {
  rcp26: "ssp126",
  rcp45: "ssp245",
  rcp85: "ssp585",
};

const SSP_TO_RCP: Record<"ssp126" | "ssp245" | "ssp585", "rcp26" | "rcp45" | "rcp85"> = {
  ssp126: "rcp26",
  ssp245: "rcp45",
  ssp585: "rcp85",
};

export const getPeriodRangeLabel = (period: Period): string => PERIOD_RANGE_LABELS[period];

export const getPeriodShortLabel = (period: Period): string => PERIOD_SHORT_LABELS[period];

export const isSeaLevelVariableId = (variableId?: string | null): boolean =>
  variableId === SEA_LEVEL_VARIABLE_ID;

export const isSspScenario = (scenario: string): scenario is "ssp126" | "ssp245" | "ssp585" =>
  SSP_SCENARIOS.includes(scenario as Scenario);

export const isRcpScenario = (scenario: string): scenario is "rcp26" | "rcp45" | "rcp85" =>
  RCP_SCENARIOS.includes(scenario as Scenario);

export const getScenarioOptions = (variableId?: string | null): Scenario[] =>
  isSeaLevelVariableId(variableId) ? SSP_SCENARIOS : RCP_SCENARIOS;

export const normalizeScenarioForVariable = (
  variableId: string | null | undefined,
  scenario: Scenario,
): Scenario => {
  if (isSeaLevelVariableId(variableId)) {
    return isSspScenario(scenario) ? scenario : RCP_TO_SSP[scenario];
  }

  return isRcpScenario(scenario) ? scenario : SSP_TO_RCP[scenario];
};

export const getScenarioLabel = (scenario: Scenario): string => SCENARIO_LABELS[scenario];

export const getScenarioDescription = (scenario: Scenario): string =>
  SCENARIO_DESCRIPTIONS[scenario];

export const getScenarioPanelLabel = (scenario: Scenario): string =>
  SCENARIO_PANEL_LABELS[scenario];

export const getVariableDisplayName = (
  variableId?: string | null,
  fallbackName?: string | null,
): string => (isSeaLevelVariableId(variableId) ? SEA_LEVEL_DISPLAY_NAME : fallbackName || "Climate Variable");
