export type ClimateSeason =
  | "annual"
  | "mam"
  | "amj"
  | "jja"
  | "jas"
  | "son"
  | "djf";

export type FormulaScenario =
  | "rcp26"
  | "rcp45"
  | "rcp85"
  | "ssp126"
  | "ssp245"
  | "ssp585";

export type FormulaPeriod = "baseline" | "2030" | "2050" | "2080";

export interface MeanTemperatureFormulaSpec {
  kind: "mean-temperature";
  season: ClimateSeason;
}

export interface RainfallTotalFormulaSpec {
  kind: "rainfall-total";
  season: ClimateSeason;
  durationDays: number;
}

export interface RainfallThresholdFormulaSpec {
  kind: "rainfall-threshold-count";
  comparison: "gte" | "lt";
  thresholdMm: number;
}

export interface RainfallMaximumFormulaSpec {
  kind: "rainfall-maximum";
  windowDays: 1 | 3 | 5;
}

export type ScientificFormulaSpec =
  | MeanTemperatureFormulaSpec
  | RainfallTotalFormulaSpec
  | RainfallThresholdFormulaSpec
  | RainfallMaximumFormulaSpec;

export interface FormulaContext {
  scenario: string;
  period: string;
}

export const SEASON_METADATA: Readonly<
  Record<ClimateSeason, { label: string; durationDays: number }>
> = {
  annual: { label: "annual", durationDays: 365 },
  mam: { label: "March–May (MAM)", durationDays: 92 },
  amj: { label: "April–June (AMJ)", durationDays: 91 },
  jja: { label: "June–August (JJA)", durationDays: 92 },
  jas: { label: "July–September (JAS)", durationDays: 92 },
  son: { label: "September–November (SON)", durationDays: 91 },
  djf: { label: "December–February (DJF)", durationDays: 90 },
};

const meanTemperature = (season: ClimateSeason): MeanTemperatureFormulaSpec => ({
  kind: "mean-temperature",
  season,
});

const rainfallTotal = (season: ClimateSeason): RainfallTotalFormulaSpec => ({
  kind: "rainfall-total",
  season,
  durationDays: SEASON_METADATA[season].durationDays,
});

const rainfallThreshold = (
  comparison: RainfallThresholdFormulaSpec["comparison"],
  thresholdMm: number,
): RainfallThresholdFormulaSpec => ({
  kind: "rainfall-threshold-count",
  comparison,
  thresholdMm,
});

const rainfallMaximum = (
  windowDays: RainfallMaximumFormulaSpec["windowDays"],
): RainfallMaximumFormulaSpec => ({
  kind: "rainfall-maximum",
  windowDays,
});

/**
 * Structured formula metadata for every temperature mean and rainfall
 * statistic documented by the atlas. Aliases are intentional: the frontend
 * parameter IDs and imported backend variable IDs are both valid lookups.
 */
export const SCIENTIFIC_FORMULA_SPECS: Readonly<
  Record<string, ScientificFormulaSpec>
> = {
  mean_temp: meanTemperature("annual"),
  mean_temp_annual: meanTemperature("annual"),
  annual_mean_temp: meanTemperature("annual"),
  mean_temp_mam: meanTemperature("mam"),
  mean_temp_apr_may_jun: meanTemperature("amj"),
  mean_temp_jja: meanTemperature("jja"),
  mean_temp_jul_aug_sep: meanTemperature("jas"),
  mean_temp_sep_oct_nov: meanTemperature("son"),
  mean_temp_dec_jan_feb: meanTemperature("djf"),
  mean_temp_dry_season: meanTemperature("djf"),

  annual_precipitation: rainfallTotal("annual"),
  precipitation_annual: rainfallTotal("annual"),
  precipitation_mam: rainfallTotal("mam"),
  precipitation_apr_may_jun: rainfallTotal("amj"),
  precipitation_jja: rainfallTotal("jja"),
  precipitation_jul_aug_sep: rainfallTotal("jas"),
  precipitation_sep_oct_nov: rainfallTotal("son"),
  precipitation_dec_jan_feb: rainfallTotal("djf"),

  heavy_precip_10mm: rainfallThreshold("gte", 10),
  heavy_precip_20mm: rainfallThreshold("gte", 20),
  wet_days: rainfallThreshold("gte", 1),
  dry_days: rainfallThreshold("lt", 1),
  max_1day_precip: rainfallMaximum(1),
  max_3day_precip: rainfallMaximum(3),
  max_5day_precip: rainfallMaximum(5),
};

const SCENARIO_NOTATION: Readonly<Record<FormulaScenario, string>> = {
  rcp26: "RCP 2.6",
  rcp45: "RCP 4.5",
  rcp85: "RCP 8.5",
  ssp126: "SSP1-2.6",
  ssp245: "SSP2-4.5",
  ssp585: "SSP5-8.5",
};

const PERIOD_NOTATION: Readonly<Record<FormulaPeriod, string>> = {
  baseline: "1991–2020",
  "2030": "2021–2040",
  "2050": "2041–2060",
  "2080": "2081–2100",
};

export const getFormulaContext = (
  scenario: FormulaScenario,
  period: FormulaPeriod,
): FormulaContext => ({
  scenario: SCENARIO_NOTATION[scenario],
  period: PERIOD_NOTATION[period],
});

export const getFormulaAccessibleLabels = (
  formula: ScientificFormulaSpec,
  scenario: FormulaScenario,
  period: FormulaPeriod,
): string[] => {
  const context = getFormulaContext(scenario, period);
  const contextText = `${context.scenario}, ${context.period}`;

  switch (formula.kind) {
    case "mean-temperature": {
      const season = SEASON_METADATA[formula.season].label;
      return [
        `Grid-cell ${season} mean temperature for ${contextText}: the mean over time of bias-adjusted near-surface air temperature tas-qdm.`,
        `District ${season} ensemble percentile temperature q for ${contextText}: the average over N d valid district grid cells of the qth ensemble percentile of grid-cell mean temperature, converted from kelvin to degrees Celsius by subtracting 273.15.`,
      ];
    }
    case "rainfall-total": {
      const season = SEASON_METADATA[formula.season].label;
      return [
        `Grid-cell ${season} accumulated rainfall for ${contextText}: 86,400 seconds per day times ${formula.durationDays} days times the mean bias-adjusted precipitation flux pr-qdm.`,
        `District ${season} ensemble percentile rainfall q for ${contextText}: the average over N d valid district grid cells of the qth ensemble percentile of rainfall accumulated over ${formula.durationDays} days, in millimetres.`,
      ];
    }
    case "rainfall-threshold-count": {
      const comparison = formula.comparison === "gte" ? "at least" : "less than";
      return [
        `Rainfall day count for ${contextText}: sum the indicator for each day whose rainfall is ${comparison} ${formula.thresholdMm} millimetres.`,
      ];
    }
    case "rainfall-maximum":
      return formula.windowDays === 1
        ? [
            `Maximum one-day rainfall for ${contextText}: the maximum daily rainfall total over time.`,
          ]
        : [
            `Maximum rolling ${formula.windowDays}-day rainfall for ${contextText}: the maximum over time of the sum of ${formula.windowDays} consecutive daily rainfall totals.`,
          ];
  }
};
