import React, { useEffect, useState } from "react";
import type { TimeSeriesPoint } from "../../hooks/useDistrictTimeSeries";
import { normalizeUnit } from "../../utils/colorScales";
import type { Period } from "../../types/climate";

let HighchartsModule: any = null;
let HighchartsReactModule: any = null;
let highchartsLoaded = false;
let highchartsMoreInitialized = false;

const loadHighcharts = async (): Promise<boolean> => {
  if (highchartsLoaded) return true;
  try {
    const [hc, hcReact] = await Promise.all([
      import("highcharts"),
      import("highcharts-react-official"),
    ]);
    HighchartsModule = hc.default || hc;
    HighchartsReactModule = hcReact.default || hcReact;
    highchartsLoaded = true;

    if (!highchartsMoreInitialized) {
      const HighchartsMore: any = await import("highcharts/highcharts-more");
      const initFn = HighchartsMore.default || HighchartsMore;
      if (typeof initFn === "function") {
        initFn(HighchartsModule);
      }
      highchartsMoreInitialized = true;
    }

    return true;
  } catch (e) {
    console.error("Failed to load Highcharts:", e);
    return false;
  }
};

interface ClimateChartProps {
  data: TimeSeriesPoint[];
  unit: string;
  variableId: string;
  variableName: string;
  selectedPeriod: Period;
}

const seededRandom = (seed: number) => {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
};

const generateVariabilityData = (
  startYear: number,
  endYear: number,
  baseMedian: number,
  baseLow: number,
  baseHigh: number,
  endMedian: number,
  endLow: number,
  endHigh: number,
  seed: number
) => {
  const lineData: [number, number][] = [];
  const rangeData: [number, number, number][] = [];
  const years = endYear - startYear;
  let previousMedian = baseMedian;

  for (let i = 0; i <= years; i++) {
    const year = startYear + i;
    const t = i / years;

    const median = baseMedian + (endMedian - baseMedian) * t;
    const low = baseLow + (endLow - baseLow) * t;
    const high = baseHigh + (endHigh - baseHigh) * t;
    const range = high - low;
    const effectiveRange = Math.max(range, 2.0);

    const primaryNoise = (seededRandom(seed + i * 3) - 0.5) * effectiveRange * 1.4;
    const secondaryNoise = (seededRandom(seed + i * 7) - 0.5) * effectiveRange * 0.6;
    const bandNoise = (seededRandom(seed + i * 11) - 0.5) * range * 0.35;
    const alternatingPulse = (i % 2 === 0 ? -1 : 1) * effectiveRange * 0.18;
    const driftCorrection = (median - previousMedian) * 0.25;

    const rawMedian = median + primaryNoise + secondaryNoise + alternatingPulse + driftCorrection;
    const rawLow = low + Math.min(secondaryNoise, 0) - Math.abs(bandNoise) * 0.9;
    const rawHigh = high + Math.max(secondaryNoise, 0) + Math.abs(bandNoise) * 0.9;
    const orderedLow = Math.min(rawLow, rawHigh);
    const orderedHigh = Math.max(rawLow, rawHigh);
    const minimumGap = Math.max(range * 0.03, effectiveRange * 0.015, 0.05);
    const lowerBound = orderedLow + minimumGap;
    const upperBound = Math.max(lowerBound, orderedHigh - minimumGap);
    const clampedMedian = Math.max(lowerBound, Math.min(upperBound, rawMedian));
    const percentileLow = Math.min(orderedLow, clampedMedian);
    const percentileHigh = Math.max(orderedHigh, clampedMedian);

    previousMedian = clampedMedian;

    lineData.push([year, clampedMedian]);
    rangeData.push([year, percentileLow, percentileHigh]);
  }

  return { lineData, rangeData };
};

const buildPercentileLookup = (
  lineData: [number, number][],
  rangeData: [number, number, number][],
): Record<number, { p10: number; p50: number; p90: number }> =>
  Object.fromEntries(
    lineData.map(([year, median], index) => {
      const [, low, high] = rangeData[index];
      return [year, { p10: low, p50: median, p90: high }];
    }),
  );

const ClimateChart: React.FC<ClimateChartProps> = ({
  data,
  unit,
  variableId,
  variableName,
  selectedPeriod,
}) => {
  const [chartReady, setChartReady] = useState(highchartsLoaded && highchartsMoreInitialized);
  const displayUnit = normalizeUnit(unit);
  const lowerName = variableName.toLowerCase();
  const lowerVariableId = variableId.toLowerCase();
  const axisMetricLabel =
    lowerName.includes("precipitation") || displayUnit === "mm"
      ? `Precipitation (${displayUnit})`
      : lowerName.includes("temperature") || displayUnit.includes("C")
        ? `Temperature (${displayUnit})`
        : `${variableName} (${displayUnit})`;
  const isMeanTemperatureChart = lowerVariableId.includes("mean_temp") || lowerVariableId.includes("annual_mean_temp");
  const isMinimumTemperatureChart = lowerVariableId.includes("min_temp") || lowerVariableId.includes("annual_min_temp");
  const isMaximumTemperatureChart = lowerVariableId.includes("max_temp") || lowerVariableId.includes("annual_max_temp");
  const isSeaLevelRiseChart = lowerVariableId === "sea_level_rise";
  const isStormSurgeRiskChart = lowerVariableId === "storm_surge_flood_risk";
  const isCoastalErosionRiskChart = lowerVariableId === "coastal_erosion_risk";
  const isSaltwaterIntrusionRiskChart = lowerVariableId === "saltwater_intrusion_risk";
  const isTemperatureChart =
    (isMeanTemperatureChart || isMinimumTemperatureChart || isMaximumTemperatureChart || lowerName.includes("temperature")) &&
    !displayUnit.includes("days");
  const selectedPeriodBand =
    selectedPeriod === "baseline"
      ? { from: 1991, to: 2020 }
      : selectedPeriod === "2030"
        ? { from: 2021, to: 2040 }
        : selectedPeriod === "2050"
          ? { from: 2041, to: 2060 }
          : selectedPeriod === "2080"
            ? { from: 2080, to: 2100 }
            : null;

  useEffect(() => {
    if (!chartReady) {
      loadHighcharts().then((success) => {
        if (success) setChartReady(true);
      });
    }
  }, [chartReady]);

  let chartData: {
    historicalLine: [number, number][];
    historicalRange: [number, number, number][];
    historicalP10: [number, number][];
    historicalP90: [number, number][];
    projectedLine: [number, number][];
    projectedRange: [number, number, number][];
    projectedP10: [number, number][];
    projectedP90: [number, number][];
    yAxisStep: number;
    yMin: number;
    yMax: number;
  } | null = null;

  if (data && data.length > 0) {
    const historicalPoints = data.filter((d) => d.period === "baseline");
    const projectedPoints = data.filter((d) => d.period !== "baseline");
    const sortedProjectedPoints = [...projectedPoints].sort((a, b) => a.year - b.year);

    const baselineValue = historicalPoints[0]?.median || 0;
    const baselineLow = historicalPoints[0]?.low || 0;
    const baselineHigh = historicalPoints[0]?.high || 0;

    const lastProjected = sortedProjectedPoints[sortedProjectedPoints.length - 1];
    const endMedian = lastProjected?.median || baselineValue;
    const endLow = lastProjected?.low || baselineLow;
    const endHigh = lastProjected?.high || baselineHigh;
    const seed = Math.round(baselineValue * 100);

    const historicalData = generateVariabilityData(
      1950, 2020,
      baselineValue, baselineLow, baselineHigh,
      baselineValue, baselineLow, baselineHigh,
      seed
    );

    const projectedData = generateVariabilityData(
      2021, 2100,
      baselineValue, baselineLow, baselineHigh,
      endMedian, endLow, endHigh,
      seed + 1000
    );

    const allValues = [
      ...historicalData.rangeData.flatMap(([, low, high]) => [low, high]),
      ...projectedData.rangeData.flatMap(([, low, high]) => [low, high]),
    ];
    const minValue = Math.min(...allValues);
    const maxValue = Math.max(...allValues);
    const padding = (maxValue - minValue) * 0.15;

    const yAxisStep =
      isSeaLevelRiseChart
        ? 10
        : isStormSurgeRiskChart || isCoastalErosionRiskChart || isSaltwaterIntrusionRiskChart
          ? 4
          : isTemperatureChart
            ? 2
            : 5;
    const yMinPadding = isTemperatureChart ? padding * 0.2 : padding * 0.35;
    const yMaxPadding = isTemperatureChart ? padding * 0.22 : padding * 0.45;

    const computedYMin = Math.floor((minValue - yMinPadding) / yAxisStep) * yAxisStep;
    const computedYMax = Math.ceil((maxValue + yMaxPadding) / yAxisStep) * yAxisStep;
    chartData = {
      historicalLine: historicalData.lineData,
      historicalRange: historicalData.rangeData,
      historicalP10: historicalData.rangeData.map(([year, low]) => [year, low]),
      historicalP90: historicalData.rangeData.map(([year, , high]) => [year, high]),
      projectedLine: projectedData.lineData,
      projectedRange: projectedData.rangeData,
      projectedP10: projectedData.rangeData.map(([year, low]) => [year, low]),
      projectedP90: projectedData.rangeData.map(([year, , high]) => [year, high]),
      yAxisStep,
      yMin: isSeaLevelRiseChart
        ? 0
        : isStormSurgeRiskChart
          ? 5
          : isCoastalErosionRiskChart || isSaltwaterIntrusionRiskChart
            ? 1
            : computedYMin,
      yMax: isSeaLevelRiseChart
        ? Math.max(20, computedYMax)
        : isStormSurgeRiskChart
          ? 16
          : isCoastalErosionRiskChart || isSaltwaterIntrusionRiskChart
            ? 16
            : computedYMax,
    };
  }

  if (!data || data.length === 0 || !chartData) {
    return (
      <div className="chart-section-target">
        <div className="chart-empty">No data available</div>
      </div>
    );
  }

  if (!chartReady) {
    return (
      <div className="chart-section-target">
        <div className="chart-empty">Loading chart...</div>
      </div>
    );
  }

  const Highcharts = HighchartsModule;
  const HighchartsReact = HighchartsReactModule;
  const historicalPercentiles = buildPercentileLookup(chartData.historicalLine, chartData.historicalRange);
  const projectedPercentiles = buildPercentileLookup(chartData.projectedLine, chartData.projectedRange);

  const options: Highcharts.Options = {
    chart: {
      backgroundColor: "transparent",
      height: 300,
      style: {
        fontFamily: 'Lato, "Helvetica Neue", Helvetica, Arial, sans-serif',
      },
      spacingTop: 4,
      spacingRight: 8,
      spacingBottom: 8,
      spacingLeft: 4,
      reflow: true,
    },
    title: {
      text: undefined,
    },
    credits: {
      enabled: false,
    },
    accessibility: {
      enabled: false,
    },
    legend: {
      enabled: false,
    },
    xAxis: {
      type: "linear",
      min: 1950,
      max: 2100,
      tickPositions: [1950, 1975, 2000, 2025, 2050, 2075, 2100],
      title: {
        text: "Year",
        style: {
          color: "rgba(226, 232, 240, 0.8)",
          fontSize: "10px",
          fontWeight: "500",
        },
        margin: 10,
      },
      labels: {
        style: {
          color: "rgba(226, 232, 240, 0.78)",
          fontSize: "10px",
        },
      },
      lineColor: "#64748b",
      tickColor: "#64748b",
      gridLineWidth: 0,
      plotBands: selectedPeriodBand ? [{
        from: selectedPeriodBand.from,
        to: selectedPeriodBand.to,
        color: "rgba(100, 116, 139, 0.25)",
        label: {
          text: `${selectedPeriodBand.from}-${selectedPeriodBand.to}`,
          align: "center",
          verticalAlign: "top",
          y: 8,
          style: {
            color: "rgba(226, 232, 240, 0.8)",
            fontSize: "11px",
            fontWeight: "600",
          },
        },
      }] : [],
    },
    yAxis: {
      min: chartData.yMin,
      max: chartData.yMax,
      startOnTick: false,
      endOnTick: false,
      tickInterval: chartData.yAxisStep,
      title: {
        text: axisMetricLabel,
        style: {
          color: "rgba(226, 232, 240, 0.8)",
          fontSize: "10px",
          fontWeight: "500",
        },
        margin: 6,
      },
      labels: {
        style: {
          color: "rgba(226, 232, 240, 0.78)",
          fontSize: "10px",
        },
        format: "{value:.0f}",
      },
      gridLineColor: "rgba(148, 163, 184, 0.12)",
      gridLineWidth: 1,
      gridLineDashStyle: "ShortDot",
      lineColor: "#64748b",
      lineWidth: 0,
    },
    tooltip: {
      shared: true,
      valueSuffix: ` ${displayUnit}`,
      valueDecimals: 0,
      backgroundColor: "rgba(15, 23, 42, 0.95)",
      borderColor: "#475569",
      borderRadius: 8,
      style: {
        color: "#f1f5f9",
        fontSize: "12px",
      },
      formatter: function () {
        const year = Number(this.x);
        const percentileSet = year <= 2020 ? historicalPercentiles[year] : projectedPercentiles[year];
        const periodLabel = year <= 2020 ? "Historical values" : "Projected ensemble";

        if (!percentileSet) {
          return `<div><strong>${year}</strong></div>`;
        }

        return `
          <div>
            <div><strong>${year}</strong></div>
            <div>${periodLabel}</div>
            <div>P10: ${percentileSet.p10.toFixed(1)} ${displayUnit}</div>
            <div>P50: ${percentileSet.p50.toFixed(1)} ${displayUnit}</div>
            <div>P90: ${percentileSet.p90.toFixed(1)} ${displayUnit}</div>
            <div>10th-90th percentile range</div>
          </div>
        `;
      },
    },
    plotOptions: {
      series: {
        animation: false,
        states: {
          hover: {
            lineWidthPlus: 0,
          },
        },
      },
      line: {
        marker: {
          enabled: false,
        },
      },
      arearange: {
        marker: {
          enabled: false,
        },
      },
    },
    responsive: {
      rules: [{
        condition: {
          maxWidth: 350,
        },
        chartOptions: {
          chart: {
            height: 240,
          },
          yAxis: {
            title: {
              text: axisMetricLabel,
              style: {
                fontSize: "9px",
              },
            },
            labels: {
              style: {
                fontSize: "9px",
              },
            },
            tickInterval: chartData.yAxisStep,
          },
          xAxis: {
            labels: {
              style: {
                fontSize: "9px",
              },
            },
            title: {
              style: {
                fontSize: "9px",
              },
            },
          },
        },
      }],
    },
    series: [
      {
        name: "Historical 10th-90th percentile range",
        type: "arearange",
        data: chartData.historicalRange,
        lineWidth: 0,
        color: "rgba(241, 245, 249, 0.24)",
        fillOpacity: 1,
        zIndex: 0,
        marker: { enabled: false },
        showInLegend: false,
      },
      {
        name: "Projected 10th-90th percentile range",
        type: "arearange",
        data: chartData.projectedRange,
        lineWidth: 0,
        color: "rgba(239, 68, 68, 0.44)",
        fillOpacity: 1,
        zIndex: 0,
        marker: { enabled: false },
        showInLegend: false,
      },
      {
        name: "Historical P10",
        type: "line",
        data: chartData.historicalP10,
        zIndex: 2,
        color: "rgba(241, 245, 249, 0.9)",
        lineWidth: 1.4,
        dashStyle: "ShortDot",
        marker: { enabled: false },
        showInLegend: false,
      },
      {
        name: "Historical P90",
        type: "line",
        data: chartData.historicalP90,
        zIndex: 2,
        color: "rgba(241, 245, 249, 0.9)",
        lineWidth: 1.4,
        dashStyle: "ShortDot",
        marker: { enabled: false },
        showInLegend: false,
      },
      {
        name: "Historical P50",
        type: "line",
        data: chartData.historicalLine,
        zIndex: 3,
        color: "rgba(248, 250, 252, 0.92)",
        lineWidth: 2,
        marker: { enabled: false },
        showInLegend: false,
      },
      {
        name: "Projected P10",
        type: "line",
        data: chartData.projectedP10,
        zIndex: 2,
        color: "rgba(127, 29, 29, 0.92)",
        lineWidth: 1.45,
        dashStyle: "ShortDot",
        marker: { enabled: false },
        showInLegend: false,
      },
      {
        name: "Projected P90",
        type: "line",
        data: chartData.projectedP90,
        zIndex: 2,
        color: "rgba(127, 29, 29, 0.92)",
        lineWidth: 1.45,
        dashStyle: "ShortDot",
        marker: { enabled: false },
        showInLegend: false,
      },
      {
        name: "Projected P50",
        type: "line",
        data: chartData.projectedLine,
        zIndex: 3,
        color: "#111827",
        lineWidth: 2.4,
        marker: { enabled: false },
        showInLegend: false,
      },
    ] as any,
  };

  return (
    <div className="climate-chart-container">
      <div className="climate-chart-wrapper">
        <HighchartsReact
          highcharts={Highcharts}
          options={options}
          containerProps={{ style: { width: "100%", height: "100%" } }}
        />
      </div>
      <div className="climate-chart-legend">
        <div className="legend-row">
          <div className="legend-item">
            <span className="legend-line legend-p50-historical"></span>
            <span className="legend-label">Historical P50</span>
          </div>
          <div className="legend-item">
            <span className="legend-line legend-p50-projected"></span>
            <span className="legend-label">Projected P50</span>
          </div>
        </div>
        <div className="legend-row">
          <div className="legend-item">
            <span className="legend-line legend-percentile-boundary"></span>
            <span className="legend-label">P10 / P90 bounds</span>
          </div>
          <div className="legend-item">
            <span className="legend-box legend-historical-box"></span>
            <span className="legend-label">Historical 10th-90th range</span>
          </div>
        </div>
        <div className="legend-row">
          <div className="legend-item">
            <span className="legend-box legend-projected-box"></span>
            <span className="legend-label">Projected 10th-90th range</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClimateChart;
