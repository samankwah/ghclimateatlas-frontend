import Highcharts from "highcharts";
import "highcharts/highcharts-more";
import "highcharts/modules/accessibility";
import HighchartsReact from "highcharts-react-official";
import type { ClimateTimeSeriesPoint } from "../../types/climate";
import { normalizeUnit } from "../../utils/colorScales";
import type { DashboardParameter } from "../../utils/publicRouting";
import { selectSeaLevelMilestones } from "./dashboardChartData";
import { anomalyLineZones, anomalyPaletteFor } from "./dashboardChartPalette";
import useResponsiveHighcharts from "./useResponsiveHighcharts";

interface DashboardChartProps {
  data: ClimateTimeSeriesPoint[];
  unit: string;
  label: string;
  scenarioLabel: string;
  parameter: DashboardParameter;
  anomaly?: boolean;
}

const decimalsForUnit = (unit: string): number => {
  if (unit === "m") return 2;
  return unit.includes("C") ? 1 : 0;
};

const formatTooltipValue = (value: number, unit: string, decimals: number): string => {
  if (unit.includes("mm")) return `${Math.round(value).toLocaleString()} mm/year`;
  return `${value.toFixed(decimals)}${unit ? ` ${unit}` : ""}`;
};

const DashboardChart = ({
  data,
  unit,
  label,
  scenarioLabel,
  parameter,
  anomaly = false,
}: DashboardChartProps) => {
  const chartRef = useResponsiveHighcharts();
  const displayUnit = normalizeUnit(unit);
  const decimals = decimalsForUnit(displayUnit);
  const seaLevelInterval = parameter === "sea-level" && !anomaly;
  const seaLevelAnomaly = parameter === "sea-level" && anomaly;
  const plottedData = seaLevelInterval ? selectSeaLevelMilestones(data) : data;
  const anomalyPalette = anomaly ? anomalyPaletteFor(parameter) : undefined;
  const anomalyPaletteDescription = parameter === "rainfall"
    ? "dry orange below zero and wet blue above zero"
    : "blue below zero and red above zero";
  const chartSeries: Highcharts.SeriesOptionsType[] = seaLevelInterval
    ? [
        {
          type: "columnrange",
          name: "p10–p90 interval",
          color: "rgba(34, 139, 157, 0.24)",
          borderColor: "#4f8492",
          borderWidth: 1,
          pointWidth: 30,
          data: plottedData.map(({ year, p10, p90 }) => [year, p10, p90]),
          zIndex: 0,
        },
        {
          type: "errorbar",
          name: "p10–p90 whiskers",
          color: "#4f6f7c",
          data: plottedData.map(({ year, p10, p90 }) => [year, p10, p90]),
          lineWidth: 1.5,
          showInLegend: false,
          stemWidth: 1.5,
          whiskerLength: "70%",
          whiskerWidth: 2,
          zIndex: 1,
        },
        {
          type: "scatter",
          name: "Median (p50)",
          color: "#006f83",
          data: plottedData.map(({ year, p50 }) => [year, p50]),
          marker: {
            enabled: true,
            fillColor: "#006f83",
            lineColor: "#ffffff",
            lineWidth: 1,
            radius: 5,
            symbol: "diamond",
          },
          zIndex: 2,
        },
      ]
    : seaLevelAnomaly
      ? [
          {
            type: "arearange",
            name: "p10–p90 model range",
            color: "#3e9aad",
            data: data.map(({ year, p10, p90 }) => [year, p10, p90]),
            enableMouseTracking: false,
            showInLegend: false,
            zIndex: 0,
          },
          {
            type: "line",
            name: "Median (p50)",
            color: "#006f83",
            data: data.map(({ year, p50 }, index) => ({
              x: year,
              y: p50,
              dataLabels: index === data.length - 1 ? {
                align: "right",
                enabled: true,
                format: "Median p50",
                style: {
                  color: "#006f83",
                  fontSize: "11px",
                  fontWeight: "700",
                  textOutline: "3px #ffffff",
                },
                x: -7,
                y: -8,
              } : undefined,
            })),
            lineWidth: 3,
            showInLegend: false,
            zIndex: 2,
          },
        ]
    : [
        {
          type: "arearange",
          name: "p10–p90 range",
          color: anomaly ? "#7893a0" : "#42a9ce",
          data: data.map(({ year, p10, p90 }) => [year, p10, p90]),
          zIndex: 0,
        },
        {
          type: "line",
          name: anomaly ? "Median anomaly (p50)" : "Median (p50)",
          color: anomaly ? anomalyPalette!.positive : "#067caf",
          lineWidth: 2.5,
          data: data.map(({ year, p50 }) => [year, p50]),
          zoneAxis: anomaly ? "y" : undefined,
          zones: anomaly ? anomalyLineZones(parameter) : undefined,
          zIndex: 2,
        },
      ];

  const options: Highcharts.Options = {
    chart: {
      animation: true,
      backgroundColor: "transparent",
      height: 360,
      spacing: [14, 10, 10, 4],
      style: { fontFamily: 'Arial, "Helvetica Neue", sans-serif' },
      zooming: { type: "x" },
    },
    accessibility: {
      description: seaLevelInterval
        ? `${label} under ${scenarioLabel}. Selected-year vertical intervals span p10 to p90 across the model ensemble, and diamond markers show the p50 median.`
        : seaLevelAnomaly
          ? `${label} under ${scenarioLabel}. A solid line shows the p50 median anomaly and the shaded ribbon spans the p10 to p90 model range.`
        : anomaly
          ? `${label} under ${scenarioLabel}. The median line is ${anomalyPaletteDescription}, with a subtle p10 to p90 ensemble range.`
          : `Yearly projection for ${label} under ${scenarioLabel}, including the median and the 10th to 90th percentile range.`,
    },
    credits: { enabled: false },
    exporting: { enabled: false },
    legend: {
      enabled: !anomaly,
      align: "right",
      verticalAlign: "top",
      layout: "horizontal",
      itemDistance: 18,
      margin: 14,
      padding: 0,
      symbolRadius: 0,
      symbolWidth: 24,
      itemStyle: { color: "#35596d", fontSize: "14px", fontWeight: "600" },
    },
    title: { text: undefined },
    tooltip: {
      shared: true,
      useHTML: true,
      backgroundColor: "rgba(255,255,255,.98)",
      borderColor: "#b8d7e6",
      borderRadius: 3,
      padding: 10,
      shadow: false,
      formatter: function () {
        const point = data.find((entry) => entry.year === Number(this.x));
        if (!point) return `<b>${this.x}</b>`;
        const sign = (value: number) => anomaly && value >= 0 ? "+" : "";
        if (anomaly) {
          const medianColor = seaLevelAnomaly
            ? "#006f83"
            : point.p50 < 0 ? anomalyPalette!.negative : anomalyPalette!.positive;
          const rangeColor = seaLevelAnomaly ? "#3e9aad" : "#7893a0";
          return [
            `<b>${point.year}</b>`,
            `<span style="color:${rangeColor}">●</span> p10: <b>${sign(point.p10)}${formatTooltipValue(point.p10, displayUnit, decimals)}</b>`,
            `<span style="color:${medianColor}">●</span> p50 median: <b>${sign(point.p50)}${formatTooltipValue(point.p50, displayUnit, decimals)}</b>`,
            `<span style="color:${rangeColor}">●</span> p90: <b>${sign(point.p90)}${formatTooltipValue(point.p90, displayUnit, decimals)}</b>`,
          ].join("<br/>");
        }
        return [
          `<b>${point.year}</b>`,
          `<span style="color:#067caf">●</span> Median: <b>${formatTooltipValue(point.p50, displayUnit, decimals)}</b>`,
          `<span style="color:#42a9ce">●</span> Range: <b>${sign(point.p10)}${formatTooltipValue(point.p10, displayUnit, decimals)} – ${sign(point.p90)}${formatTooltipValue(point.p90, displayUnit, decimals)}</b>`,
        ].join("<br/>");
      },
    },
    xAxis: {
      type: "linear",
      min: plottedData[0]?.year,
      max: plottedData[plottedData.length - 1]?.year,
      tickAmount: seaLevelInterval ? undefined : 7,
      tickPositions: seaLevelInterval ? plottedData.map(({ year }) => year) : undefined,
      allowDecimals: false,
      crosshair: { color: "#5fb4d5", dashStyle: "ShortDot", width: 1 },
      gridLineColor: anomaly || seaLevelInterval ? "#e2e8ec" : undefined,
      gridLineDashStyle: seaLevelAnomaly ? "Solid" : anomaly || seaLevelInterval ? "Dash" : undefined,
      gridLineWidth: anomaly || seaLevelInterval ? 1 : 0,
      lineColor: "#9fb9c6",
      lineWidth: anomaly ? 0 : 1,
      tickColor: "#9fb9c6",
      tickLength: anomaly ? 0 : 5,
      tickWidth: anomaly ? 0 : 1,
      title: { text: "Year", style: { color: "#547384", fontSize: "13px" } },
      labels: { style: { color: "#547384", fontSize: "12px" } },
    },
    yAxis: {
      title: {
        text: `${anomaly ? "Change from reference" : label}${displayUnit ? ` (${displayUnit})` : ""}`,
        style: { color: "#547384", fontSize: "13px" },
      },
      min: seaLevelInterval ? 0 : undefined,
      gridLineColor: anomaly || seaLevelInterval ? "#e2e8ec" : "#e5eef2",
      gridLineDashStyle: seaLevelAnomaly ? "Solid" : anomaly || seaLevelInterval ? "Dash" : "Solid",
      lineColor: "#9fb9c6",
      lineWidth: anomaly ? 0 : 1,
      tickColor: "#9fb9c6",
      tickLength: anomaly ? 0 : 5,
      tickWidth: anomaly ? 0 : 1,
      plotLines: anomaly ? [{
        color: seaLevelAnomaly ? "#37474f" : "#647782",
        dashStyle: seaLevelAnomaly ? "Solid" : "Dot",
        value: 0,
        width: seaLevelAnomaly ? 1.5 : 2,
        zIndex: 3,
      }] : [],
      labels: {
        style: { color: "#547384", fontSize: "12px" },
        format: anomaly ? `{value:+.${decimals}f}` : `{value:.${decimals}f}`,
      },
    },
    plotOptions: {
      series: {
        animation: { duration: 350 },
        marker: { enabled: false },
        states: { inactive: { opacity: 1 } },
      },
      arearange: {
        fillOpacity: seaLevelAnomaly ? 0.2 : anomaly ? 0.12 : 0.24,
        lineWidth: 0,
        marker: { enabled: false },
      },
      columnrange: {
        grouping: false,
        groupPadding: 0.15,
        pointPadding: 0.08,
      },
    },
    series: chartSeries,
    responsive: {
      rules: [{
        condition: { maxWidth: 600 },
        chartOptions: {
          chart: { height: 325 },
          legend: { align: "right", itemDistance: 10, itemStyle: { fontSize: "12px" } },
          plotOptions: { columnrange: { pointWidth: 20 } },
          yAxis: { title: { text: undefined } },
        },
      }],
    },
  };

  return (
    <figure className="dashboard-chart">
      <HighchartsReact
        ref={chartRef}
        highcharts={Highcharts}
        options={options}
        containerProps={{ style: { width: "100%", minWidth: 0 } }}
      />
    </figure>
  );
};

export default DashboardChart;
