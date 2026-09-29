import type { DashboardParameter } from "../../utils/publicRouting";

export interface AnomalyPalette {
  negative: string;
  positive: string;
}

export interface AnomalyLineZone {
  color: string;
  value?: number;
}

export const ANOMALY_PALETTES: Record<DashboardParameter, AnomalyPalette> = {
  temperature: {
    negative: "#2563eb",
    positive: "#dc2626",
  },
  rainfall: {
    negative: "#d97706",
    positive: "#0284c7",
  },
  "sea-level": {
    negative: "#006f83",
    positive: "#006f83",
  },
};

export const anomalyPaletteFor = (parameter: DashboardParameter): AnomalyPalette =>
  ANOMALY_PALETTES[parameter];

export const anomalyLineZones = (parameter: DashboardParameter): AnomalyLineZone[] => {
  const palette = anomalyPaletteFor(parameter);
  return [
    { value: 0, color: palette.negative },
    { color: palette.positive },
  ];
};

export const anomalyColorForValue = (
  parameter: DashboardParameter,
  value: number,
): string => {
  const palette = anomalyPaletteFor(parameter);
  return value < 0 ? palette.negative : palette.positive;
};
