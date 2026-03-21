// Data export utilities for CSV and PDF generation

import type { TimeSeriesPoint } from "../hooks/useDistrictTimeSeries";
import { normalizeUnit } from "./colorScales";

const getScenarioExportLabel = (scenario: string): string => {
  if (scenario === "rcp26") return "Low Carbon (RCP 2.6)";
  if (scenario === "rcp45") return "Medium Carbon (RCP 4.5)";
  return "High Carbon (RCP 8.5)";
};

interface ExportOptions {
  districtName: string;
  regionName: string;
  variableName: string;
  unit: string;
  scenario: string;
  data: TimeSeriesPoint[];
}

export const exportToCSV = (options: ExportOptions): void => {
  const { districtName, regionName, variableName, unit, scenario, data } = options;
  const displayUnit = normalizeUnit(unit);

  const headers = ["Period", "Year", "Low", "Median", "High", "Unit"];
  const rows = data.map((point) => [
    point.label,
    point.year.toString(),
    point.low.toFixed(2),
    point.median.toFixed(2),
    point.high.toFixed(2),
    displayUnit,
  ]);

  const metadata = [
    "# Ghana Climate Atlas - Climate Data Export",
    `# District: ${districtName}`,
    `# Region: ${regionName}`,
    `# Variable: ${variableName}`,
    `# Scenario: ${getScenarioExportLabel(scenario)}`,
    `# Generated: ${new Date().toISOString()}`,
    "# Data Source: CORDEX-Africa",
    "",
  ];

  const csvContent = [
    ...metadata,
    headers.join(","),
    ...rows.map((row) => row.join(",")),
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute(
    "download",
    `climate_data_${districtName.toLowerCase().replace(/\s+/g, "_")}_${scenario}.csv`
  );
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const exportToPDF = (options: ExportOptions): void => {
  const { districtName, regionName, variableName, unit, scenario, data } = options;
  const displayUnit = normalizeUnit(unit);

  const scenarioLabel = getScenarioExportLabel(scenario);

  const formatValue = (value: number) => {
    if (displayUnit === "°C") return `${value.toFixed(1)}${displayUnit}`;
    if (displayUnit === "mm" || displayUnit === "days") return `${Math.round(value)} ${displayUnit}`;
    return `${value.toFixed(1)} ${displayUnit}`;
  };

  const baseline = data.find((d) => d.period === "baseline");
  const future2080 = data.find((d) => d.period === "2080");
  const change = baseline && future2080 ? future2080.median - baseline.median : 0;
  const changePercent =
    baseline && baseline.median !== 0
      ? ((change / baseline.median) * 100).toFixed(1)
      : "0";

  const reportContent = `
GHANA CLIMATE ATLAS
Climate Report for ${districtName}
=====================================

LOCATION
--------
District: ${districtName}
Region: ${regionName}

CLIMATE VARIABLE
----------------
Parameter: ${variableName}
Scenario: ${scenarioLabel}

SUMMARY
-------
Baseline (1991-2020): ${baseline ? formatValue(baseline.median) : "N/A"}
Projected (2080-2100): ${future2080 ? formatValue(future2080.median) : "N/A"}
Expected Change: ${change >= 0 ? "+" : ""}${formatValue(change)} (${changePercent}%)

TIME SERIES DATA
----------------
${data.map((d) => `${d.label} (${d.year}): ${formatValue(d.median)} [${formatValue(d.low)} - ${formatValue(d.high)}]`).join("\n")}

DATA SOURCE
-----------
Climate projections derived from CORDEX-Africa regional climate models
downscaled for Ghana using the KAPy framework.

Generated: ${new Date().toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })}

---
Ghana Climate Atlas | https://climate.ghana.gov.gh
`.trim();

  const blob = new Blob([reportContent], { type: "text/plain;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute(
    "download",
    `climate_report_${districtName.toLowerCase().replace(/\s+/g, "_")}_${scenario}.txt`
  );
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const exportAll = (options: ExportOptions): void => {
  exportToCSV(options);
  setTimeout(() => {
    exportToPDF(options);
  }, 500);
};
