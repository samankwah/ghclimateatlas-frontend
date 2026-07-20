import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  SCIENTIFIC_FORMULA_SPECS,
  getFormulaAccessibleLabels,
  getFormulaContext,
} from "../src/components/Categories/scientificFormulas.ts";
import {
  PARAMETER_DESCRIPTIONS,
} from "../src/components/Categories/parameterDescriptions.ts";

const temperatureSeasons = {
  mean_temp: "annual",
  mean_temp_annual: "annual",
  mean_temp_mam: "mam",
  mean_temp_apr_may_jun: "amj",
  mean_temp_jja: "jja",
  mean_temp_jul_aug_sep: "jas",
  mean_temp_sep_oct_nov: "son",
  mean_temp_dec_jan_feb: "djf",
};

const rainfallDurations = {
  annual_precipitation: ["annual", 365],
  precipitation_annual: ["annual", 365],
  precipitation_mam: ["mam", 92],
  precipitation_apr_may_jun: ["amj", 91],
  precipitation_jja: ["jja", 92],
  precipitation_jul_aug_sep: ["jas", 92],
  precipitation_sep_oct_nov: ["son", 91],
  precipitation_dec_jan_feb: ["djf", 90],
};

test("maps every documented mean-temperature definition to its season", () => {
  for (const [parameterId, season] of Object.entries(temperatureSeasons)) {
    const formula = SCIENTIFIC_FORMULA_SPECS[parameterId];
    assert.deepEqual(formula, { kind: "mean-temperature", season }, parameterId);
    assert.equal(PARAMETER_DESCRIPTIONS[parameterId].formula, formula, parameterId);
  }

  assert.deepEqual(SCIENTIFIC_FORMULA_SPECS.annual_mean_temp, {
    kind: "mean-temperature",
    season: "annual",
  });
  assert.deepEqual(SCIENTIFIC_FORMULA_SPECS.mean_temp_dry_season, {
    kind: "mean-temperature",
    season: "djf",
  });
});

test("maps every annual and seasonal rainfall total to the pipeline duration", () => {
  for (const [parameterId, [season, durationDays]] of Object.entries(rainfallDurations)) {
    const formula = SCIENTIFIC_FORMULA_SPECS[parameterId];
    assert.deepEqual(
      formula,
      { kind: "rainfall-total", season, durationDays },
      parameterId,
    );
    assert.equal(PARAMETER_DESCRIPTIONS[parameterId].formula, formula, parameterId);
  }
});

test("maps rainfall day thresholds and rolling extremes to standard parameters", () => {
  const thresholds = {
    heavy_precip_10mm: ["gte", 10],
    heavy_precip_20mm: ["gte", 20],
    wet_days: ["gte", 1],
    dry_days: ["lt", 1],
  };

  for (const [parameterId, [comparison, thresholdMm]] of Object.entries(thresholds)) {
    const formula = SCIENTIFIC_FORMULA_SPECS[parameterId];
    assert.deepEqual(
      formula,
      { kind: "rainfall-threshold-count", comparison, thresholdMm },
      parameterId,
    );
    assert.equal(PARAMETER_DESCRIPTIONS[parameterId].formula, formula, parameterId);
  }

  for (const windowDays of [1, 3, 5]) {
    const parameterId = `max_${windowDays}day_precip`;
    const formula = SCIENTIFIC_FORMULA_SPECS[parameterId];
    assert.deepEqual(formula, { kind: "rainfall-maximum", windowDays }, parameterId);
    assert.equal(PARAMETER_DESCRIPTIONS[parameterId].formula, formula, parameterId);
  }
});

test("retains the plain-text formula fallback for unrelated indicators", () => {
  assert.equal(typeof PARAMETER_DESCRIPTIONS.sea_level_rise.formula, "string");
  assert.equal(PARAMETER_DESCRIPTIONS.sea_level_rise.formula, "Projected relative sea-level rise");
});

test("builds accessible labels with selected scenario and atlas-period notation", () => {
  assert.deepEqual(getFormulaContext("rcp45", "2050"), {
    scenario: "RCP 4.5",
    period: "2041–2060",
  });

  const temperatureLabels = getFormulaAccessibleLabels(
    SCIENTIFIC_FORMULA_SPECS.mean_temp_jja,
    "rcp45",
    "2050",
  );
  assert.equal(temperatureLabels.length, 2);
  assert.match(temperatureLabels[0], /JJA.*RCP 4\.5, 2041–2060.*tas-qdm/);
  assert.match(temperatureLabels[1], /JJA.*RCP 4\.5, 2041–2060.*273\.15/);

  const rainfallLabels = getFormulaAccessibleLabels(
    SCIENTIFIC_FORMULA_SPECS.precipitation_jja,
    "rcp85",
    "2080",
  );
  assert.equal(rainfallLabels.length, 2);
  assert.match(rainfallLabels[0], /JJA.*RCP 8\.5, 2081–2100.*92 days.*pr-qdm/);
  assert.match(rainfallLabels[1], /JJA.*RCP 8\.5, 2081–2100.*92 days/);
  assert.ok(rainfallLabels.every((label) => label.trim().length > 0));
});

test("removes inaccurate and vague legacy formula text from climate cards", async () => {
  const descriptionsSource = await readFile(
    new URL("../src/components/Categories/parameterDescriptions.ts", import.meta.url),
    "utf8",
  );
  const categoriesSource = await readFile(
    new URL("../src/components/Categories/categoryParameters.ts", import.meta.url),
    "utf8",
  );
  const rendererSource = await readFile(
    new URL("../src/components/Categories/ScientificFormula.tsx", import.meta.url),
    "utf8",
  );
  const cssSource = await readFile(new URL("../src/App.css", import.meta.url), "utf8");

  assert.doesNotMatch(descriptionsSource, /Tmean\s*=\s*\(Tmax\s*\+\s*Tmin\)\s*\/\s*2/);
  assert.doesNotMatch(descriptionsSource, /Sum\(P/);
  assert.match(rendererSource, /<math[^>]*aria-label=\{label\}/);
  assert.match(cssSource, /\.modal-equation-scroll\s*\{[\s\S]*?overflow-x:\s*auto/);

  for (const parameterId of [
    "mean_temp_annual",
    "mean_temp_dec_jan_feb",
    "mean_temp_mam",
    "mean_temp_jja",
    "mean_temp_sep_oct_nov",
    ...Object.keys(rainfallDurations).filter((id) => id !== "annual_precipitation"),
  ]) {
    assert.match(
      categoriesSource,
      new RegExp(`id: "${parameterId}"[\\s\\S]{0,180}infoId: "${parameterId}"`),
      `${parameterId} should open its own scientific description`,
    );
  }
});

test("starts structured technical content with the equation and keeps context accessible-only", async () => {
  const rendererSource = await readFile(
    new URL("../src/components/Categories/ScientificFormula.tsx", import.meta.url),
    "utf8",
  );

  assert.doesNotMatch(rendererSource, /modal-equation-title/);
  assert.doesNotMatch(rendererSource, /modal-formula-context/);
  assert.doesNotMatch(
    rendererSource,
    /District formula|Daily threshold count|Maximum one-day rainfall|Maximum rolling rainfall/,
  );
  assert.match(rendererSource, /getFormulaAccessibleLabels\(formula, scenario, period\)/);
  assert.match(rendererSource, /<math[^>]*aria-label=\{label\}/);
});

test("keeps the visible rainfall-total equation concise", async () => {
  const rendererSource = await readFile(
    new URL("../src/components/Categories/ScientificFormula.tsx", import.meta.url),
    "utf8",
  );
  const rainfallEquation = rendererSource.match(
    /const RainfallTotalEquation[\s\S]*?const RainfallThresholdEquation/,
  )?.[0];

  assert.ok(rainfallEquation, "rainfall-total equation should be present");
  assert.match(rainfallEquation, /<msub><mi>P<\/mi><mi>d<\/mi><\/msub>/);
  assert.match(rainfallEquation, /<msub><mi>R<\/mi><mi>g<\/mi><\/msub>/);
  assert.doesNotMatch(rainfallEquation, /<msubsup>|<mi>Q<\/mi>|<mi>q<\/mi>|<mi>m<\/mi>/);
});

test("keeps the visible mean-temperature equation concise", async () => {
  const rendererSource = await readFile(
    new URL("../src/components/Categories/ScientificFormula.tsx", import.meta.url),
    "utf8",
  );
  const temperatureEquation = rendererSource.match(
    /const TemperatureEquation[\s\S]*?const RainfallTotalEquation/,
  )?.[0];

  assert.ok(temperatureEquation, "mean-temperature equation should be present");
  assert.match(temperatureEquation, /<msub><mi>T<\/mi><mi>d<\/mi><\/msub>/);
  assert.match(temperatureEquation, /<msub><mi>T<\/mi><mi>g<\/mi><\/msub>/);
  assert.doesNotMatch(
    temperatureEquation,
    /<msubsup>|<mi>Q<\/mi>|<mi>q<\/mi>|<mi>m<\/mi>|273\.15/,
  );
});
