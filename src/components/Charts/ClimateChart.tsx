import React, { useEffect, useMemo, useState } from "react";
import type { ClimateTimeSeriesResponse, Period, Scenario } from "../../types/climate";
import { normalizeUnit } from "../../utils/colorScales";

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
  } catch (error) {
    console.error("Failed to load Highcharts:", error);
    return false;
  }
};

interface ClimateChartProps {
  series: ClimateTimeSeriesResponse | null;
  variableName: string;
  scenario: Scenario;
  selectedPeriod: Period;
  showChange?: boolean;
}

const PERIOD_BANDS: Record<Period, { from: number; to: number }> = {
  baseline: { from: 1991, to: 2020 },
  "2030": { from: 2021, to: 2040 },
  "2050": { from: 2041, to: 2060 },
  "2080": { from: 2081, to: 2100 },
};

const SCENARIO_CHART_META: Record<Scenario, { label: string; color: string }> = {
  rcp26: { label: "RCP2.6", color: "#2f9e44" },
  rcp45: { label: "RCP4.5", color: "#f08c00" },
  rcp85: { label: "RCP8.5", color: "#e03131" },
  ssp126: { label: "SSP1-2.6", color: "#2f9e44" },
  ssp245: { label: "SSP2-4.5", color: "#f08c00" },
  ssp585: { label: "SSP5-8.5", color: "#e03131" },
};

const getAxisLabel = (variableName: string, displayUnit: string): string => {
  const lowerName = variableName.toLowerCase();
  if (lowerName.includes("precipitation") || displayUnit.includes("mm")) {
    return `Precipitation (${displayUnit})`;
  }
  if (lowerName.includes("temperature") || displayUnit.includes("C")) {
    return `Temperature (${displayUnit})`;
  }
  if (lowerName.includes("sea level")) {
    return `Sea level rise (${displayUnit})`;
  }
  return `${variableName} (${displayUnit})`;
};

const getValueDecimals = (displayUnit: string): number => {
  if (displayUnit === "m") return 2;
  return displayUnit.includes("C") ? 1 : 0;
};

const formatTooltipValue = (value: number, displayUnit: string, valueDecimals: number): string => {
  if (displayUnit.includes("mm")) {
    return `${Math.round(value).toLocaleString()} mm/year`;
  }
  return `${value.toFixed(valueDecimals)} ${displayUnit}`;
};

const getYAxisBounds = (values: number[], options?: { minFloor?: number }) => {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const padding = span * 0.12;
  const computedMin = min - padding;

  return {
    min: options?.minFloor !== undefined ? Math.max(options.minFloor, Math.min(options.minFloor, computedMin)) : computedMin,
    max: max + padding,
  };
};

const ClimateChart: React.FC<ClimateChartProps> = ({
  series,
  variableName,
  scenario,
  selectedPeriod,
  showChange = false,
}) => {
  const [chartReady, setChartReady] = useState(highchartsLoaded && highchartsMoreInitialized);

  useEffect(() => {
    if (!chartReady) {
      loadHighcharts().then((success) => {
        if (success) setChartReady(true);
      });
    }
  }, [chartReady]);

  const displayUnit = normalizeUnit(series?.unit || "");
  const valueDecimals = getValueDecimals(displayUnit);
  const baseAxisLabel = getAxisLabel(variableName, displayUnit);
  const axisMetricLabel = showChange ? `Change from baseline (${displayUnit})` : baseAxisLabel;
  const scenarioMeta = SCENARIO_CHART_META[scenario];
  const selectedPeriodBand = PERIOD_BANDS[selectedPeriod];
  const isAnnualRainfallChart =
    variableName.toLowerCase() === "annual precipitation" &&
    displayUnit.includes("mm");
  const baselineRef = useMemo(() => {
    if (!series?.data.length) return 0;
    if (series.reference_mean && series.reference_mean !== 0) {
      return series.reference_mean;
    }
    const baselinePoints = series.data.filter(
      (p) => p.year >= 1991 && p.year <= 2020
    );
    if (!baselinePoints.length) return 0;
    const sum = baselinePoints.reduce((acc, p) => acc + p.p50, 0);
    return sum / baselinePoints.length;
  }, [series]);

  const chartData = useMemo(() => {
    if (!series?.data.length) {
      return null;
    }

    const offset = showChange ? baselineRef : 0;
    const lineData = series.data.map((point) => [point.year, point.p50 - offset] as [number, number]);
    const rangeData = series.data.map((point) => [point.year, point.p10 - offset, point.p90 - offset] as [number, number, number]);
    const allValues = series.data.flatMap((point) => [point.p10 - offset, point.p50 - offset, point.p90 - offset]);
    const yAxis = getYAxisBounds(
      allValues,
      isAnnualRainfallChart
        ? { minFloor: showChange ? -600 : 500 }
        : undefined
    );

    return { lineData, rangeData, yAxis };
  }, [baselineRef, isAnnualRainfallChart, series, showChange]);

  if (!series || !chartData) {
    return (
      <div className="climate-chart-container">
        <div className="chart-empty">No yearly data available</div>
      </div>
    );
  }

  if (!chartReady) {
    return (
      <div className="climate-chart-container">
        <div className="chart-empty">Loading chart...</div>
      </div>
    );
  }

  const Highcharts = HighchartsModule;
  const HighchartsReact = HighchartsReactModule;
  const legendValue = displayUnit.includes("mm")
    ? `${Math.round(baselineRef).toLocaleString()} mm/year`
    : `${baselineRef.toFixed(valueDecimals)} ${displayUnit}`;
  const legendLabel = showChange
    ? `${scenarioMeta.label} • Δ from ref ${legendValue}`
    : `${scenarioMeta.label} • Ref ${legendValue}`;

  const options: Highcharts.Options = {
    chart: {
      backgroundColor: "transparent",
      plotBackgroundColor: "transparent",
      borderWidth: 0,
      height: 450,
      spacingTop: 6,
      spacingRight: 8,
      spacingBottom: 20,
      spacingLeft: 6,
      style: {
        fontFamily: 'Lato, "Helvetica Neue", Helvetica, Arial, sans-serif',
      },
    },
    title: {
      text: undefined,
      margin: 0,
    },
    credits: {
      enabled: false,
    },
    accessibility: {
      enabled: false,
    },
    legend: {
      enabled: true,
      align: "center",
      verticalAlign: "bottom",
      layout: "horizontal",
      floating: false,
      itemStyle: {
        color: "rgba(226, 232, 240, 0.9)",
        fontSize: "10px",
        fontWeight: "400",
      },
      itemDistance: 10,
      itemMarginTop: 2,
      itemMarginBottom: 2,
      symbolRadius: 0,
      symbolWidth: 22,
      symbolHeight: 10,
      padding: 0,
      margin: 4,
    },
    xAxis: {
      type: "linear",
      min: 1950,
      max: 2100,
      tickPositions: [1950, 1975, 2000, 2025, 2050, 2075, 2100],
      title: {
        text: "Year",
        style: {
          color: "rgba(226, 232, 240, 0.85)",
          fontSize: "10px",
        },
      },
      labels: {
        rotation: 0,
        style: {
          color: "rgba(226, 232, 240, 0.78)",
          fontSize: "9px",
        },
      },
      lineColor: "rgba(148, 163, 184, 0.55)",
      tickColor: "rgba(148, 163, 184, 0.55)",
      gridLineColor: "rgba(148, 163, 184, 0.12)",
      gridLineWidth: 1,
      plotBands: [
        {
          from: selectedPeriodBand.from,
          to: selectedPeriodBand.to,
          color: "rgba(148, 163, 184, 0.16)",
          label: {
            text: `${selectedPeriodBand.from}-${selectedPeriodBand.to}`,
            align: "center",
            verticalAlign: "top",
            y: 8,
            style: {
              color: "rgba(226, 232, 240, 0.82)",
              fontSize: "10px",
              fontWeight: "600",
            },
          },
        },
      ],
    },
    yAxis: {
      min: chartData.yAxis.min,
      max: chartData.yAxis.max,
      startOnTick: false,
      endOnTick: false,
      minPadding: 0,
      maxPadding: 0.02,
      title: {
        text: axisMetricLabel,
        style: {
          color: "rgba(226, 232, 240, 0.85)",
          fontSize: "10px",
        },
      },
      labels: {
        style: {
          color: "rgba(226, 232, 240, 0.78)",
          fontSize: "10px",
        },
        formatter: function () {
          return Highcharts.numberFormat(Number(this.value), valueDecimals);
        },
      },
      gridLineColor: "rgba(148, 163, 184, 0.12)",
      gridLineWidth: 1,
      lineColor: "rgba(148, 163, 184, 0.55)",
      lineWidth: 1,
      plotLines: showChange
        ? [
            {
              value: 0,
              color: "rgba(226, 232, 240, 0.55)",
              width: 1,
              dashStyle: "Dash",
              zIndex: 3,
              label: {
                text: "Baseline",
                align: "right",
                x: -6,
                y: -4,
                style: {
                  color: "rgba(226, 232, 240, 0.8)",
                  fontSize: "9px",
                },
              },
            },
          ]
        : undefined,
    },
    tooltip: {
      shared: true,
      backgroundColor: "rgba(30, 41, 59, 0.96)",
      borderColor: "rgba(148, 163, 184, 0.35)",
      borderRadius: 10,
      padding: 0,
      shadow: false,
      style: {
        color: "#f8fafc",
        fontSize: "12px",
      },
      formatter: function () {
        const point = series.data.find((entry) => entry.year === Number(this.x));
        if (!point) {
          return `<div class="chart-tooltip-card"><div class="chart-tooltip-year">${this.x}</div></div>`;
        }

        const offset = showChange ? baselineRef : 0;
        const sign = (v: number) => (showChange && v >= 0 ? "+" : "");
        const p50 = point.p50 - offset;
        const p10 = point.p10 - offset;
        const p90 = point.p90 - offset;

        return `
          <div class="chart-tooltip-card">
            <div class="chart-tooltip-year">${point.year}</div>
            <div class="chart-tooltip-row">
              <span class="chart-tooltip-label">${showChange ? "Δ Median" : "Median"}</span>
              <span class="chart-tooltip-value">${sign(p50)}${formatTooltipValue(p50, displayUnit, valueDecimals)}</span>
            </div>
            <div class="chart-tooltip-row">
              <span class="chart-tooltip-label">Range</span>
              <span class="chart-tooltip-value">${sign(p10)}${formatTooltipValue(p10, displayUnit, valueDecimals)} - ${sign(p90)}${formatTooltipValue(p90, displayUnit, valueDecimals)}</span>
            </div>
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
        lineWidth: 0,
        marker: {
          enabled: false,
        },
      },
    },
    responsive: {
      rules: [{
        condition: {
          maxWidth: 520,
        },
        chartOptions: {
          chart: {
            height: 320,
          },
          legend: {
            align: "center",
            verticalAlign: "bottom",
            layout: "horizontal",
            itemStyle: {
              fontSize: "10px",
            },
          },
          xAxis: {
            labels: {
              style: {
                fontSize: "10px",
              },
            },
          },
          yAxis: {
            labels: {
              style: {
                fontSize: "10px",
              },
            },
          },
        },
      }, {
        condition: {
          maxWidth: 360,
        },
        chartOptions: {
          chart: {
            height: 380,
          },
          legend: {
            align: "center",
            verticalAlign: "bottom",
            layout: "horizontal",
            itemStyle: {
              fontSize: "9px",
            },
          },
          xAxis: {
            labels: {
              style: {
                fontSize: "9px",
              },
            },
          },
          yAxis: {
            labels: {
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
        name: "10th-90th percentile range",
        type: "arearange",
        data: chartData.rangeData,
        color: scenarioMeta.color,
        fillOpacity: 0.22,
        showInLegend: false,
        zIndex: 0,
      },
      {
        name: legendLabel,
        type: "line",
        data: chartData.lineData,
        color: scenarioMeta.color,
        lineWidth: 2,
        zIndex: 1,
      },
    ] as any,
  };

  return (
    <div className="climate-chart-container">
      <div className="climate-chart-wrapper">
        <HighchartsReact
          key={showChange ? "anomaly" : "absolute"}
          highcharts={Highcharts}
          options={options}
          containerProps={{ style: { width: "100%", height: "100%" } }}
        />
      </div>
    </div>
  );
};

export default ClimateChart;
