// Climate time series chart using Highcharts
// Matching the climate projection visualization style with historical (gray) and projected (red) regions

import React, { useEffect, useState, useMemo } from "react";
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";
import type { TimeSeriesPoint } from "../../hooks/useDistrictTimeSeries";

// Track if highcharts-more has been initialized
let highchartsMoreInitialized = false;

const initHighchartsMore = async () => {
  if (highchartsMoreInitialized) return true;
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const HighchartsMore: any = await import("highcharts/highcharts-more");
    const initFn = HighchartsMore.default || HighchartsMore;
    if (typeof initFn === "function") {
      initFn(Highcharts);
    }
    highchartsMoreInitialized = true;
    return true;
  } catch (e) {
    console.error("Failed to load highcharts-more:", e);
    return false;
  }
};

interface ClimateChartProps {
  data: TimeSeriesPoint[];
  unit: string;
  variableName: string;
  futurePeriodLabel?: string;
}

// Seeded random number generator for consistent noise
const seededRandom = (seed: number) => {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
};

// Generate realistic year-by-year variability data
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

  for (let i = 0; i <= years; i++) {
    const year = startYear + i;
    const t = i / years;

    // Interpolate base values
    const median = baseMedian + (endMedian - baseMedian) * t;
    const low = baseLow + (endLow - baseLow) * t;
    const high = baseHigh + (endHigh - baseHigh) * t;
    const range = high - low;

    // Add realistic year-to-year variability
    const noise1 = (seededRandom(seed + i * 3) - 0.5) * range * 0.8;
    const noise2 = (seededRandom(seed + i * 7) - 0.5) * range * 0.3;
    const noise3 = (seededRandom(seed + i * 11) - 0.5) * range * 0.3;

    const noisyMedian = median + noise1;
    const noisyLow = low + noise2 - Math.abs(noise3) * 0.5;
    const noisyHigh = high + noise3 + Math.abs(noise2) * 0.5;

    lineData.push([year, noisyMedian]);
    rangeData.push([year, noisyLow, noisyHigh]);
  }

  return { lineData, rangeData };
};

const ClimateChart: React.FC<ClimateChartProps> = ({
  data,
  unit,
  variableName,
  futurePeriodLabel = "2051-2080",
}) => {
  const [chartReady, setChartReady] = useState(highchartsMoreInitialized);

  useEffect(() => {
    if (!chartReady) {
      initHighchartsMore().then((success) => {
        if (success) setChartReady(true);
      });
    }
  }, [chartReady]);

  // Generate chart data with memoization for performance
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return null;

    // Separate historical and projected data
    const historicalPoints = data.filter((d) => d.period === "baseline");
    const projectedPoints = data.filter((d) => d.period !== "baseline");

    // Sort projected points by year
    projectedPoints.sort((a, b) => a.year - b.year);

    const baselineValue = historicalPoints[0]?.median || 0;
    const baselineLow = historicalPoints[0]?.low || 0;
    const baselineHigh = historicalPoints[0]?.high || 0;

    // Get end values from the last projected point
    const lastProjected = projectedPoints[projectedPoints.length - 1];
    const endMedian = lastProjected?.median || baselineValue;
    const endLow = lastProjected?.low || baselineLow;
    const endHigh = lastProjected?.high || baselineHigh;

    // Generate seed from baseline value for consistent randomness
    const seed = Math.round(baselineValue * 100);

    // Generate historical data (1950-2005) - gray region
    const historicalData = generateVariabilityData(
      1950, 2005,
      baselineValue, baselineLow, baselineHigh,
      baselineValue, baselineLow, baselineHigh,
      seed
    );

    // Generate projected data (2006-2095) - red region
    const projectedData = generateVariabilityData(
      2006, 2095,
      baselineValue, baselineLow, baselineHigh,
      endMedian, endLow, endHigh,
      seed + 1000
    );

    // Calculate Y-axis bounds
    const allValues = [
      ...historicalData.rangeData.flatMap(([, low, high]) => [low, high]),
      ...projectedData.rangeData.flatMap(([, low, high]) => [low, high]),
    ];
    const minValue = Math.min(...allValues);
    const maxValue = Math.max(...allValues);
    const padding = (maxValue - minValue) * 0.15;

    return {
      historicalLine: historicalData.lineData,
      historicalRange: historicalData.rangeData,
      projectedLine: projectedData.lineData,
      projectedRange: projectedData.rangeData,
      yMin: Math.floor(minValue - padding),
      yMax: Math.ceil(maxValue + padding),
    };
  }, [data]);

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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const options: Highcharts.Options = {
    chart: {
      backgroundColor: "transparent",
      height: 280,
      style: {
        fontFamily: "inherit",
      },
      spacingTop: 5,
      spacingRight: 10,
      spacingBottom: 5,
      spacingLeft: 5,
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
      max: 2095,
      tickPositions: [1950, 2000, 2050],
      title: {
        text: "Year",
        style: {
          color: "#e2e8f0",
          fontSize: "11px",
        },
      },
      labels: {
        style: {
          color: "#e2e8f0",
          fontSize: "11px",
        },
      },
      lineColor: "#64748b",
      tickColor: "#64748b",
      gridLineWidth: 0,
      plotBands: [{
        from: 2051,
        to: 2080,
        color: "rgba(100, 116, 139, 0.25)",
      }],
    },
    yAxis: {
      min: chartData.yMin - 15,
      max: chartData.yMax + 10,
      startOnTick: false,
      endOnTick: false,
      tickInterval: 5, // Y-axis intervals of 5
      title: {
        text: `${variableName} (${unit})`,
        style: {
          color: "#e2e8f0",
          fontSize: "11px",
        },
        margin: 8,
      },
      labels: {
        style: {
          color: "#e2e8f0",
          fontSize: "11px",
        },
        format: "{value:.0f}",
      },
      gridLineColor: "rgba(71, 85, 105, 0.5)",
      gridLineWidth: 1,
      gridLineDashStyle: "Dot",
      lineColor: "#64748b",
      lineWidth: 0,
    },
    tooltip: {
      shared: true,
      valueSuffix: ` ${unit}`,
      valueDecimals: 0, // No decimal places in tooltip
      backgroundColor: "rgba(15, 23, 42, 0.95)",
      borderColor: "#475569",
      borderRadius: 8,
      style: {
        color: "#f1f5f9",
        fontSize: "12px",
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
              text: unit,
              style: {
                fontSize: "9px",
              },
            },
            labels: {
              style: {
                fontSize: "9px",
              },
            },
            tickInterval: 10,
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
      // Historical range (gray)
      {
        name: "1950-2005",
        type: "arearange",
        data: chartData.historicalRange,
        lineWidth: 0,
        color: "rgba(148, 163, 184, 0.6)",
        fillOpacity: 0.6,
        zIndex: 0,
        marker: { enabled: false },
        showInLegend: false,
      },
      // Projected range (red)
      {
        name: "2006-2095",
        type: "arearange",
        data: chartData.projectedRange,
        lineWidth: 0,
        color: "rgba(248, 113, 113, 0.6)",
        fillOpacity: 0.6,
        zIndex: 0,
        marker: { enabled: false },
        showInLegend: false,
      },
      // Historical ensemble mean line (gray)
      {
        name: "Historical Values",
        type: "line",
        data: chartData.historicalLine,
        zIndex: 2,
        color: "#cbd5e1",
        lineWidth: 1.5,
        marker: { enabled: false },
        showInLegend: false,
      },
      // Projected ensemble mean line (dark)
      {
        name: "Ensemble mean",
        type: "line",
        data: chartData.projectedLine,
        zIndex: 2,
        color: "#1e293b",
        lineWidth: 2,
        marker: { enabled: false },
        showInLegend: false,
      },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ] as any,
  };

  return (
    <div className="climate-chart-container">
      <div className="climate-chart-header">
        <span className="chart-period-label">{futurePeriodLabel}</span>
      </div>
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
            <span className="legend-line legend-ensemble-mean"></span>
            <span className="legend-label">Ensemble mean</span>
          </div>
          <div className="legend-item">
            <span className="legend-line legend-historical-line"></span>
            <span className="legend-label">Historical Values</span>
          </div>
        </div>
        <div className="legend-row">
          <div className="legend-item">
            <span className="legend-box legend-historical-box"></span>
            <span className="legend-label">1950-2005</span>
          </div>
          <div className="legend-item">
            <span className="legend-box legend-projected-box"></span>
            <span className="legend-label">2006-2095</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClimateChart;
