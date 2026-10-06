import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  anomalyColorForValue,
  anomalyLineZones,
  anomalyPaletteFor,
} from "../src/components/PublicSite/dashboardChartPalette.ts";
import {
  selectSeaLevelMilestones,
} from "../src/components/PublicSite/dashboardChartData.ts";

const readSource = (relativePath) => readFile(new URL(relativePath, import.meta.url), "utf8");

test("selects semantic anomaly palettes for each dashboard parameter", () => {
  assert.deepEqual(anomalyPaletteFor("temperature"), {
    negative: "#2563eb",
    positive: "#dc2626",
  });
  assert.deepEqual(anomalyPaletteFor("rainfall"), {
    negative: "#d97706",
    positive: "#0284c7",
  });
  assert.deepEqual(anomalyPaletteFor("sea-level"), {
    negative: "#006f83",
    positive: "#006f83",
  });
});

test("maps a median series crossing zero to negative and positive line zones", () => {
  const crossingSeries = [-0.8, -0.1, 0, 0.6];

  assert.deepEqual(anomalyLineZones("temperature"), [
    { value: 0, color: "#2563eb" },
    { color: "#dc2626" },
  ]);
  assert.deepEqual(
    crossingSeries.map((value) => anomalyColorForValue("temperature", value)),
    ["#2563eb", "#2563eb", "#dc2626", "#dc2626"],
  );
  assert.deepEqual(
    crossingSeries.map((value) => anomalyColorForValue("rainfall", value)),
    ["#d97706", "#d97706", "#0284c7", "#0284c7"],
  );
});

test("selects representative sea-level years for an interval plot", () => {
  const yearly = Array.from({ length: 110 }, (_, index) => ({
    year: 1991 + index,
    p10: index / 200,
    p50: index / 150,
    p90: index / 100,
  }));

  assert.deepEqual(
    selectSeaLevelMilestones(yearly).map(({ year }) => year),
    [1991, 2020, 2030, 2050, 2080, 2100],
  );
  assert.equal(selectSeaLevelMilestones(yearly.slice(49, 70)).length, 6);
});

test("configures line anomaly mode with split zones, a subtle band, and signed tooltip rows", async () => {
  const [chartSource, pageSource] = await Promise.all([
    readSource("../src/components/PublicSite/DashboardChart.tsx"),
    readSource("../src/components/PublicSite/DashboardPage.tsx"),
  ]);

  assert.match(chartSource, /parameter: DashboardParameter/);
  assert.match(chartSource, /enabled: !anomaly/);
  assert.match(chartSource, /zoneAxis: anomaly \? "y" : undefined/);
  assert.match(chartSource, /zones: anomaly \? anomalyLineZones\(parameter\) : undefined/);
  assert.match(chartSource, /fillOpacity: seaLevelAnomaly \? 0\.2 : anomaly \? 0\.12 : 0\.24/);
  assert.match(chartSource, /color: anomaly \? "#7893a0" : "#42a9ce"/);
  assert.match(chartSource, /dashStyle: seaLevelAnomaly \? "Solid" : "Dot"/);
  assert.match(chartSource, /gridLineDashStyle: seaLevelAnomaly \? "Solid" : anomaly \|\| seaLevelInterval \? "Dash"/);
  assert.match(chartSource, /> p10: <b>/);
  assert.match(chartSource, /> p50 median: <b>/);
  assert.match(chartSource, /> p90: <b>/);
  assert.match(chartSource, /value >= 0 \? "\+" : ""/);
  assert.match(chartSource, /with a subtle p10 to p90 ensemble range/);
  // The chart has no "View chart data" table under it.
  assert.doesNotMatch(chartSource, /View chart data|chart-data-table/);
  assert.match(pageSource, /Split-color median with a subtle p10–p90 ensemble range/);
  assert.equal(pageSource.match(/parameter=\{selection\.parameter\}/g)?.length, 2);
});

test("renders sea-level anomalies as a median line with an uncertainty ribbon", async () => {
  const [chartSource, pageSource] = await Promise.all([
    readSource("../src/components/PublicSite/DashboardChart.tsx"),
    readSource("../src/components/PublicSite/DashboardPage.tsx"),
  ]);

  assert.match(chartSource, /parameter === "sea-level" && anomaly/);
  assert.match(chartSource, /type: "arearange"[\s\S]*name: "p10–p90 model range"/);
  assert.match(chartSource, /color: "#3e9aad"/);
  assert.match(chartSource, /type: "line"[\s\S]*name: "Median \(p50\)"/);
  assert.match(chartSource, /color: "#006f83"/);
  assert.match(chartSource, /format: "Median p50"/);
  assert.match(chartSource, /fillOpacity: seaLevelAnomaly \? 0\.2/);
  assert.doesNotMatch(chartSource, /seaLevelTrendEquation/);
  assert.doesNotMatch(chartSource, /name: "Positive anomaly"/);
  assert.match(pageSource, /Median projection with p10–p90 uncertainty range/);
  assert.match(pageSource, /shaded ribbon spans p10–p90/);
});

test("preserves the absolute chart line, uncertainty band, legend, and axis styling", async () => {
  const chartSource = await readSource("../src/components/PublicSite/DashboardChart.tsx");

  assert.match(chartSource, /color: anomaly \? anomalyPalette!\.positive : "#067caf"/);
  assert.match(chartSource, /color: anomaly \? "#7893a0" : "#42a9ce"/);
  assert.match(chartSource, /fillOpacity: seaLevelAnomaly \? 0\.2 : anomaly \? 0\.12 : 0\.24/);
  assert.match(chartSource, /lineWidth: 2\.5/);
  assert.match(chartSource, /align: "right"/);
  assert.match(chartSource, /verticalAlign: "top"/);
  assert.match(chartSource, /lineWidth: anomaly \? 0 : 1/);
  assert.match(chartSource, /tickLength: anomaly \? 0 : 5/);
});

test("keeps dashboard controls in a practical two-column mobile grid", async () => {
  const css = await readSource("../src/components/PublicSite/public-site.css");

  assert.match(css, /@media \(max-width: 620px\)[\s\S]*\.dashboard-controls-grid \{ grid-template-columns: repeat\(2, minmax\(0, 1fr\)\); \}/);
  assert.match(css, /\.dashboard-controls-grid > :nth-child\(3\) \{ grid-column: 1 \/ -1; \}/);
  assert.match(css, /\.dashboard-controls-grid > :nth-child\(5\) \{ grid-column: auto; \}/);
});

test("uses an honest percentile interval plot for absolute sea-level projections", async () => {
  const [chartSource, pageSource] = await Promise.all([
    readSource("../src/components/PublicSite/DashboardChart.tsx"),
    readSource("../src/components/PublicSite/DashboardPage.tsx"),
  ]);

  assert.match(chartSource, /parameter === "sea-level" && !anomaly/);
  assert.match(chartSource, /type: "columnrange"/);
  assert.match(chartSource, /type: "errorbar"/);
  assert.match(chartSource, /type: "scatter"/);
  assert.match(chartSource, /name: "p10–p90 interval"/);
  assert.match(chartSource, /symbol: "diamond"/);
  assert.match(chartSource, /Selected-year vertical intervals span p10 to p90/);
  assert.match(pageSource, /These are projection percentiles, not sample quartiles/);

  assert.match(pageSource, /Ensemble interval plot · p10–p90 with p50 median/);
});
