export interface IndicatorSummaryRow {
  category: string;
  reference: string;
  low: string;
  medium: string;
  high: string;
  unit: string;
}

export interface IndicatorSummaryGroup {
  indicator: string;
  rows: IndicatorSummaryRow[];
}

export const INDICATOR_SUMMARY_PERIODS = {
  reference: "1991-2020",
  low: "2021-2040",
  medium: "2041-2060",
  high: "2081-2100",
} as const;

// Projected changes relative to the reference period, median [10th - 90th percentile].
export const INDICATOR_SUMMARY: IndicatorSummaryGroup[] = [
  {
    indicator: "Temperature",
    rows: [
      { category: "Annual", reference: "27.4", low: "0.8 [0.6 - 1.3]", medium: "1.8 [1.5 - 2.4]", high: "4.2 [3.1 - 4.8]", unit: "°C" },
      { category: "DJF", reference: "27.9", low: "0.8 [0.5 - 1.4]", medium: "2.0 [1.6 - 2.7]", high: "4.3 [3.2 - 5.5]", unit: "°C" },
      { category: "AMJ", reference: "28.2", low: "1.0 [0.6 - 1.4]", medium: "2.0 [1.5 - 2.5]", high: "4.3 [3.3 - 4.9]", unit: "°C" },
      { category: "JAS", reference: "25.5", low: "0.8 [0.4 - 1.1]", medium: "1.6 [1.4 - 2.1]", high: "3.6 [2.6 - 4.3]", unit: "°C" },
      { category: "SON", reference: "26.6", low: "0.8 [0.4 - 1.2]", medium: "1.7 [1.4 - 2.3]", high: "4.0 [2.8 - 4.7]", unit: "°C" },
    ],
  },
  {
    indicator: "Rainfall",
    rows: [
      { category: "Annual", reference: "1124", low: "6 [-78 - 77]", medium: "19 [-50 - 79]", high: "20 [-185 - 193]", unit: "mm" },
      { category: "Dry season (DJF)", reference: "64", low: "-1 [-10 - 10]", medium: "1 [-12 - 18]", high: "0 [-18 - 25]", unit: "mm" },
      { category: "Wet season (AMJ)", reference: "337", low: "-9 [-33 - 20]", medium: "-5 [-36 - 34]", high: "-28 [-104 - 56]", unit: "mm" },
      { category: "Wet season (JAS)", reference: "497", low: "18 [-36 - 59]", medium: "16 [-33 - 63]", high: "34 [-98 - 127]", unit: "mm" },
      { category: "Wet season (SON)", reference: "347", low: "6 [-30 - 42]", medium: "15 [-22 - 53]", high: "23 [-41 - 94]", unit: "mm" },
    ],
  },
  {
    indicator: "Mean Sea Level",
    rows: [
      { category: "Annual", reference: "N/A", low: "0.42 [0.29 - 0.6]", medium: "0.52 [0.38 - 0.72]", high: "0.69 [0.53 - 0.92]", unit: "m" },
      { category: "Annual", reference: "N/A", low: "0.48 [0.36 - 0.66]", medium: "0.58 [0.45 - 0.78]", high: "0.75 [0.60 - 0.98]", unit: "m" },
    ],
  },
];
