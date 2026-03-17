const COASTAL_DISTRICTS = new Set([
  "Accra Metropolitan",
  "Tema Metropolitan",
  "Kpone Katamanso",
  "Ada East",
  "Ada West",
  "Ningo Prampram",
  "Shai Osudoku",
  "Krowor",
  "Ledzokuku",
  "La Dade-Kotopon",
  "Ga South",
  "Sekondi-Takoradi Metropolitan",
  "Effia Kwesimintsim",
  "Shama",
  "Ahanta West",
  "Ellembelle",
  "Jomoro",
  "Nzema East",
  "Cape Coast Metropolitan",
  "Komenda-Edina-Eguafo-Abrem",
  "Mfantseman",
  "Ekumfi",
  "Gomoa West",
  "Gomoa East",
  "Effutu",
  "Awutu Senya East",
  "Awutu Senya West",
  "Keta",
  "Ketu South",
  "South Tongu",
]);

const REGION_PROXY_SCORES: Record<string, number> = {
  "Greater Accra": 0.18,
  "Western": 0.16,
  "Central": 0.16,
  "Volta": 0.14,
  "Eastern": 0.1,
  "Ashanti": 0.08,
  "Bono": 0.07,
  "Bono East": 0.06,
  "Ahafo": 0.06,
  "Western North": 0.07,
  "Oti": 0.05,
  "Northern": 0.05,
  "North East": 0.04,
  "Savannah": 0.04,
  "Upper East": 0.04,
  "Upper West": 0.04,
};

export type CoastalExposureKind = "direct" | "indirect";

export interface CoastalExposure {
  kind: CoastalExposureKind;
  score: number;
}

export const SEA_LEVEL_VARIABLE_IDS = [
  "sea_level_rise",
  "storm_surge_flood_risk",
  "coastal_erosion_risk",
  "saltwater_intrusion_risk",
] as const;

const SEA_LEVEL_RISK_VARIABLE_IDS = new Set([
  "storm_surge_flood_risk",
  "coastal_erosion_risk",
  "saltwater_intrusion_risk",
]);

export const isSeaLevelVariable = (variableId: string): boolean =>
  SEA_LEVEL_VARIABLE_IDS.includes(variableId as (typeof SEA_LEVEL_VARIABLE_IDS)[number]);

export const isSeaLevelRiskVariable = (variableId: string): boolean =>
  SEA_LEVEL_RISK_VARIABLE_IDS.has(variableId);

export const getCoastalExposure = (districtName: string, regionName: string): CoastalExposure => {
  if (COASTAL_DISTRICTS.has(districtName)) {
    return { kind: "direct", score: 1 };
  }

  return {
    kind: "indirect",
    score: REGION_PROXY_SCORES[regionName] ?? 0.04,
  };
};

export const getCoastalContextLabel = (variableId: string, districtName: string, regionName: string): string | null => {
  if (!isSeaLevelRiskVariable(variableId)) {
    return null;
  }

  const exposure = getCoastalExposure(districtName, regionName);
  if (exposure.kind === "direct") {
    return "Direct coastal exposure";
  }

  return "Indirect coastal influence";
};
