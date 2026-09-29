import assert from "node:assert/strict";
import test from "node:test";
import {
  formatOverviewStatistic,
  overviewStatisticDisplay,
  summarizeLateCenturyProjection,
} from "../src/utils/overviewStatistics.ts";

const series = (overrides = {}) => ({
  variable: "annual_mean_temp",
  variable_name: "Annual Mean Temperature",
  scenario: "rcp45",
  unit: "°C",
  district_id: "GH-GRE-ACCRA",
  district_name: "Accra Metropolitan",
  reference_period: { start: 1991, end: 2020 },
  reference_mean: 27,
  data: [
    { year: 2080, p10: 28, p50: 29, p90: 30 },
    { year: 2081, p10: 29, p50: 30, p90: 31 },
    { year: 2100, p10: 31, p50: 32, p90: 33 },
  ],
  ...overrides,
});

test("summarizes the late-century median against the API reference mean", () => {
  const statistic = summarizeLateCenturyProjection(series());

  assert.deepEqual(statistic, {
    absoluteChange: 4,
    lateEnd: 2100,
    lateMean: 31,
    lateStart: 2081,
    percentChange: (4 / 27) * 100,
    referenceEnd: 2020,
    referenceMean: 27,
    referenceStart: 1991,
    unit: "°C",
  });
});

test("returns no statistic without late-century values and handles a zero reference", () => {
  assert.equal(summarizeLateCenturyProjection(series({ data: [] })), null);
  assert.equal(summarizeLateCenturyProjection(series({ reference_mean: 0 }))?.percentChange, null);
});

const statistic = (overrides = {}) => ({
  absoluteChange: 1.52,
  lateEnd: 2100,
  lateMean: 28.7,
  lateStart: 2081,
  percentChange: null,
  referenceEnd: 2020,
  referenceMean: 27.18,
  referenceStart: 1991,
  unit: "°C",
  ...overrides,
});

test("splits each statistic kind into an animatable value and a fixed suffix", () => {
  assert.deepEqual(
    overviewStatisticDisplay("temperature", statistic(), "°C"),
    { decimals: 1, signed: true, suffix: "°C", value: 1.52 },
  );

  assert.deepEqual(
    overviewStatisticDisplay("rainfall", statistic({ percentChange: -0.44, unit: "mm" }), "mm"),
    { decimals: 1, signed: true, suffix: "%", value: -0.44 },
  );

  // Sea level arrives in metres and is shown in centimetres.
  assert.deepEqual(
    overviewStatisticDisplay("sea-level", statistic({ absoluteChange: 0.514, unit: "m" }), "m"),
    { decimals: 0, signed: true, suffix: " cm", value: 51.4 },
  );

  // Anything else keeps the raw change and its unit.
  assert.deepEqual(
    overviewStatisticDisplay("sea-level", statistic({ absoluteChange: 51.4, unit: "cm" }), "cm"),
    { decimals: 1, signed: true, suffix: " cm", value: 51.4 },
  );
  assert.deepEqual(
    overviewStatisticDisplay("rainfall", statistic({ percentChange: null, unit: "" }), ""),
    { decimals: 0, signed: true, suffix: "", value: 1.52 },
  );
});

test("formats the settled value and any interpolated value the same way", () => {
  const temperature = overviewStatisticDisplay("temperature", statistic(), "°C");
  assert.equal(formatOverviewStatistic(temperature), "+1.5°C");
  assert.equal(formatOverviewStatistic(temperature, 0), "0.0°C");
  assert.equal(formatOverviewStatistic(temperature, 0.83), "+0.8°C");

  const rainfall = overviewStatisticDisplay("rainfall", statistic({ percentChange: -0.44 }), "mm");
  assert.equal(formatOverviewStatistic(rainfall), "-0.4%");

  const seaLevel = overviewStatisticDisplay("sea-level", statistic({ absoluteChange: 0.514, unit: "m" }), "m");
  assert.equal(formatOverviewStatistic(seaLevel), "+51 cm");
  assert.equal(formatOverviewStatistic(seaLevel, 12.4), "+12 cm");
});

test("the stories count animates unsigned through the same formatter", () => {
  const stories = { decimals: 0, signed: false, suffix: "", value: 12 };
  assert.equal(formatOverviewStatistic(stories), "12");
  assert.equal(formatOverviewStatistic(stories, 7.4), "7");
});
