// Data export utilities for CSV and PDF generation

import type { TimeSeriesPoint } from "../hooks/useDistrictTimeSeries";

interface ExportOptions {
  districtName: string;
  regionName: string;
  variableName: string;
  unit: string;
  scenario: string;
  data: TimeSeriesPoint[];
}

// Generate and download CSV file
export const exportToCSV = (options: ExportOptions): void => {
  const { districtName, regionName, variableName, unit, scenario, data } = options;

  // Build CSV content
  const headers = ["Period", "Year", "Low", "Median", "High", "Unit"];
  const rows = data.map((point) => [
    point.label,
    point.year.toString(),
    point.low.toFixed(2),
    point.median.toFixed(2),
    point.high.toFixed(2),
    unit,
  ]);

  // Add metadata header
  const metadata = [
    `# Ghana Climate Atlas - Climate Data Export`,
    `# District: ${districtName}`,
    `# Region: ${regionName}`,
    `# Variable: ${variableName}`,
    `# Scenario: ${scenario === "rcp45" ? "Low Carbon (RCP 4.5)" : "High Carbon (RCP 8.5)"}`,
    `# Generated: ${new Date().toISOString()}`,
    `# Data Source: CORDEX-Africa`,
    ``,
  ];

  const csvContent = [
    ...metadata,
    headers.join(","),
    ...rows.map((row) => row.join(",")),
  ].join("\n");

  // Create and download file
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

// Generate and download PDF report
export const exportToPDF = (options: ExportOptions): void => {
  const { districtName, regionName, variableName, unit, scenario, data } = options;

  // Build simple text-based report (in lieu of a full PDF library)
  // For a production app, you'd use a library like jsPDF
  const scenarioLabel =
    scenario === "rcp45" ? "Low Carbon (RCP 4.5)" : "High Carbon (RCP 8.5)";

  const formatValue = (value: number) => {
    if (unit === "°C") return `${value.toFixed(1)}${unit}`;
    if (unit === "mm" || unit === "days") return `${Math.round(value)} ${unit}`;
    return `${value.toFixed(1)} ${unit}`;
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
Projected (2071-2100): ${future2080 ? formatValue(future2080.median) : "N/A"}
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

  // Create and download as text file (would be PDF in production)
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

// Export all data (combines both formats in a single download)
export const exportAll = (options: ExportOptions): void => {
  exportToCSV(options);
  // Small delay to prevent browser blocking multiple downloads
  setTimeout(() => {
    exportToPDF(options);
  }, 500);
};
