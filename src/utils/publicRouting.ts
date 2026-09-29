import type { ClimateTimeSeriesPoint, ClimateVariable, Scenario } from "../types/climate";

export const PUBLIC_ROUTE_PATHS = [
  "/",
  "/overview",
  "/dashboard",
  "/case-studies",
  "/documents",
  "/guide",
] as const;

export type PublicRoutePath = (typeof PUBLIC_ROUTE_PATHS)[number];
export type CaseStudyRoutePath = `/case-studies/${string}`;
export type AppRoutePath = PublicRoutePath | CaseStudyRoutePath | "/map";

export interface PublicNavItem {
  label: string;
  href: PublicRoutePath;
}

export const PUBLIC_NAV_ITEMS: PublicNavItem[] = [
  { label: "Overview", href: "/overview" },
  { label: "Dashboard", href: "/dashboard" },
  { label: "Case Studies", href: "/case-studies" },
  { label: "Documents", href: "/documents" },
  { label: "How-to Guide", href: "/guide" },
];

export const MAP_QUERY_KEYS = [
  "variable",
  "period",
  "scenario",
  "district",
  "change",
  "display",
] as const;

export const NAVIGATION_EVENT = "atlas:navigation";
export const ATLAS_HISTORY_STATE_KEY = "__ghanaClimateAtlasEntry";

const APP_ROUTES = new Set<string>([...PUBLIC_ROUTE_PATHS, "/map"]);

export const normalizePathname = (pathname: string): string => {
  if (!pathname || pathname === "/") return "/";
  const normalized = pathname.startsWith("/") ? pathname : `/${pathname}`;
  return normalized.replace(/\/+$/, "") || "/";
};

export const caseStudyIdFromPathname = (pathname: string): string | null => {
  const match = normalizePathname(pathname).match(/^\/case-studies\/([^/]+)$/);
  if (!match?.[1]) return null;

  try {
    return decodeURIComponent(match[1]);
  } catch {
    return null;
  }
};

export const caseStudyPath = (storyId: string): CaseStudyRoutePath =>
  `/case-studies/${encodeURIComponent(storyId)}`;

export const isKnownRoute = (pathname: string): pathname is AppRoutePath => {
  const normalized = normalizePathname(pathname);
  return APP_ROUTES.has(normalized) || caseStudyIdFromPathname(normalized) !== null;
};

export const isRouteActive = (pathname: string, href: string): boolean => {
  const normalizedPathname = normalizePathname(pathname);
  const normalizedHref = normalizePathname(href);
  if (normalizedHref === "/case-studies") {
    return normalizedPathname === normalizedHref || caseStudyIdFromPathname(normalizedPathname) !== null;
  }
  return normalizedPathname === normalizedHref;
};

export const migrateLegacyMapLocation = (
  pathname: string,
  search: string,
  hash = "",
): string | null => {
  if (normalizePathname(pathname) !== "/") return null;

  const current = new URLSearchParams(search);
  const hasMapState = MAP_QUERY_KEYS.some((key) => current.has(key));
  if (!hasMapState) return null;

  const migrated = new URLSearchParams();
  MAP_QUERY_KEYS.forEach((key) => {
    current.getAll(key).forEach((value) => migrated.append(key, value));
  });

  const query = migrated.toString();
  return `/map${query ? `?${query}` : ""}${hash}`;
};

const historyStateRecord = (state: unknown): Record<string, unknown> =>
  state !== null && typeof state === "object" && !Array.isArray(state)
    ? { ...(state as Record<string, unknown>) }
    : {};

export const markAtlasHistoryEntry = (state?: unknown): Record<string, unknown> => ({
  ...historyStateRecord(state),
  [ATLAS_HISTORY_STATE_KEY]: true,
});

export const isAtlasHistoryEntry = (state: unknown): boolean =>
  state !== null &&
  typeof state === "object" &&
  (state as Record<string, unknown>)[ATLAS_HISTORY_STATE_KEY] === true;

export const replaceCurrentHistoryUrl = (href: string): void => {
  if (typeof window === "undefined") return;
  window.history.replaceState(window.history.state, "", href);
};

export const navigate = (href: string, options: { replace?: boolean } = {}): void => {
  if (typeof window === "undefined") return;

  const url = new URL(href, window.location.href);
  const next = `${url.pathname}${url.search}${url.hash}`;
  if (options.replace) {
    window.history.replaceState(markAtlasHistoryEntry(window.history.state), "", next);
  } else {
    window.history.pushState(markAtlasHistoryEntry(), "", next);
  }
  window.dispatchEvent(new Event(NAVIGATION_EVENT));
};

export const navigateBackFromMap = (): void => {
  if (typeof window === "undefined") return;

  if (isAtlasHistoryEntry(window.history.state)) {
    window.history.back();
    return;
  }

  navigate("/overview", { replace: true });
};

export const DASHBOARD_DEFAULTS = {
  district: "GH-GRE-ACCRA",
  variable: "annual_mean_temp",
  scenario: "rcp45" as Scenario,
  from: 1991,
  to: 2100,
} as const;

export const DASHBOARD_MIN_YEAR = 1991;
export const DASHBOARD_MAX_YEAR = 2100;

export type DashboardParameter = "temperature" | "rainfall" | "sea-level";
export type DashboardTimeScale = "annual" | "djf" | "mam" | "amj" | "jja" | "jas" | "son";

export interface DashboardVariableSelection {
  parameter: DashboardParameter;
  timeScale: DashboardTimeScale;
}

export const DASHBOARD_PARAMETER_LABELS: Record<DashboardParameter, string> = {
  temperature: "Temperature",
  rainfall: "Rainfall",
  "sea-level": "Sea Level",
};

export const DASHBOARD_TIME_SCALE_LABELS: Record<DashboardTimeScale, string> = {
  annual: "Annual",
  djf: "Dec–Feb",
  mam: "Mar–May",
  amj: "Apr–Jun",
  jja: "Jun–Aug",
  jas: "Jul–Sep",
  son: "Sep–Nov",
};

const DASHBOARD_VARIABLE_MAP: Record<DashboardParameter, Partial<Record<DashboardTimeScale, string>>> = {
  temperature: {
    annual: "annual_mean_temp",
    djf: "mean_temp_dry_season",
    mam: "mean_temp_mam",
    jja: "mean_temp_jja",
    son: "mean_temp_sep_oct_nov",
  },
  rainfall: {
    annual: "annual_precipitation",
    djf: "precipitation_dec_jan_feb",
    mam: "precipitation_mam",
    amj: "precipitation_apr_may_jun",
    jja: "precipitation_jja",
    jas: "precipitation_jul_aug_sep",
    son: "precipitation_sep_oct_nov",
  },
  "sea-level": { annual: "sea_level_rise" },
};

export const DASHBOARD_VARIABLE_IDS = Object.values(DASHBOARD_VARIABLE_MAP)
  .flatMap((mapping) => Object.values(mapping))
  .filter((variable): variable is string => Boolean(variable));

export const isDashboardVariable = (variable: string): boolean =>
  DASHBOARD_VARIABLE_IDS.includes(variable);

export const dashboardTimeScaleOptions = (
  parameter: DashboardParameter,
): DashboardTimeScale[] => Object.keys(DASHBOARD_VARIABLE_MAP[parameter]) as DashboardTimeScale[];

export const dashboardDistrictOptions = <T extends IdentifiedItem>(
  districts: T[],
  parameter: DashboardParameter,
  seaLevelDistrictIds: ReadonlySet<string> | null,
): T[] => {
  if (parameter !== "sea-level") return districts;
  if (!seaLevelDistrictIds) return [];
  return districts.filter(({ id }) => seaLevelDistrictIds.has(id));
};

export const dashboardDistrictForParameter = (
  districtId: string,
  parameter: DashboardParameter,
  availableDistricts: IdentifiedItem[],
): string => {
  if (parameter !== "sea-level" || availableDistricts.some(({ id }) => id === districtId)) {
    return districtId;
  }
  return availableDistricts.find(({ id }) => id === DASHBOARD_DEFAULTS.district)?.id
    ?? availableDistricts[0]?.id
    ?? districtId;
};

export const dashboardVariableForSelection = (
  parameter: DashboardParameter,
  timeScale: DashboardTimeScale,
): string => DASHBOARD_VARIABLE_MAP[parameter][timeScale]
  ?? DASHBOARD_VARIABLE_MAP[parameter].annual
  ?? DASHBOARD_DEFAULTS.variable;

export const dashboardSelectionFromVariable = (variable: string): DashboardVariableSelection => {
  for (const parameter of Object.keys(DASHBOARD_VARIABLE_MAP) as DashboardParameter[]) {
    const match = Object.entries(DASHBOARD_VARIABLE_MAP[parameter])
      .find(([, variableId]) => variableId === variable);
    if (match) return { parameter, timeScale: match[0] as DashboardTimeScale };
  }
  return { parameter: "temperature", timeScale: "annual" };
};

export interface DashboardQueryState {
  district: string;
  variable: string;
  scenario: Scenario;
  from: number;
  to: number;
}

interface IdentifiedItem {
  id: string;
}

const RCP_SCENARIOS: Scenario[] = ["rcp26", "rcp45", "rcp85"];
const SSP_SCENARIOS: Scenario[] = ["ssp126", "ssp245", "ssp585"];

export const dashboardScenarioOptions = (variable: string): Scenario[] =>
  variable === "sea_level_rise" ? SSP_SCENARIOS : RCP_SCENARIOS;

const scenarioEquivalent = (variable: string, scenario: string | null): Scenario => {
  const options = dashboardScenarioOptions(variable);
  if (options.includes(scenario as Scenario)) return scenario as Scenario;

  const equivalents: Record<string, Scenario> = {
    rcp26: "ssp126",
    rcp45: "ssp245",
    rcp85: "ssp585",
    ssp126: "rcp26",
    ssp245: "rcp45",
    ssp585: "rcp85",
  };
  const equivalent = scenario ? equivalents[scenario] : undefined;
  if (equivalent && options.includes(equivalent)) return equivalent;
  return variable === "sea_level_rise" ? "ssp245" : DASHBOARD_DEFAULTS.scenario;
};

const parseDashboardYear = (value: string | null, fallback: number): number => {
  if (!value || !/^\d{4}$/.test(value)) return fallback;
  const year = Number(value);
  return year >= DASHBOARD_MIN_YEAR && year <= DASHBOARD_MAX_YEAR ? year : fallback;
};

export const normalizeDashboardQuery = (
  search: string,
  districts: IdentifiedItem[] = [],
  variables: IdentifiedItem[] = [],
): DashboardQueryState => {
  const params = new URLSearchParams(search);
  const districtIds = new Set(districts.map(({ id }) => id));
  const variableIds = new Set(variables.map(({ id }) => id).filter(isDashboardVariable));

  const districtCandidate = params.get("district");
  const districtFallback = districtIds.has(DASHBOARD_DEFAULTS.district)
    ? DASHBOARD_DEFAULTS.district
    : districts[0]?.id || DASHBOARD_DEFAULTS.district;
  const district = districtCandidate && districtIds.has(districtCandidate)
    ? districtCandidate
    : districtFallback;

  const variableCandidate = params.get("variable");
  const variableFallback = variableIds.has(DASHBOARD_DEFAULTS.variable)
    ? DASHBOARD_DEFAULTS.variable
    : variables[0]?.id || DASHBOARD_DEFAULTS.variable;
  const variable = variableCandidate && variableIds.has(variableCandidate)
    ? variableCandidate
    : variableFallback;

  let from = parseDashboardYear(params.get("from"), DASHBOARD_DEFAULTS.from);
  let to = parseDashboardYear(params.get("to"), DASHBOARD_DEFAULTS.to);
  if (from > to) [from, to] = [to, from];

  return {
    district,
    variable,
    scenario: scenarioEquivalent(variable, params.get("scenario")),
    from,
    to,
  };
};

export const dashboardQueryString = (state: DashboardQueryState): string => {
  const params = new URLSearchParams({
    district: state.district,
    variable: state.variable,
    scenario: state.scenario,
    from: String(state.from),
    to: String(state.to),
  });
  return params.toString();
};

export const filterDashboardSeries = (
  data: ClimateTimeSeriesPoint[],
  from: number,
  to: number,
): ClimateTimeSeriesPoint[] => data.filter(({ year }) => year >= from && year <= to);

export const anomalyFromReference = (
  data: ClimateTimeSeriesPoint[],
  referenceMean: number,
): ClimateTimeSeriesPoint[] => data.map((point) => ({
  ...point,
  p10: point.p10 - referenceMean,
  p50: point.p50 - referenceMean,
  p90: point.p90 - referenceMean,
}));

const csvCell = (value: string | number): string => {
  const text = String(value);
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

export const dashboardSeriesCsv = (
  data: ClimateTimeSeriesPoint[],
  metadata: { district: string; variable: string; scenario: string; unit: string },
): string => [
  ["District", metadata.district],
  ["Variable", metadata.variable],
  ["Scenario", metadata.scenario],
  ["Unit", metadata.unit],
  [],
  ["Year", "p10", "p50", "p90"],
  ...data.map(({ year, p10, p50, p90 }) => [year, p10, p50, p90]),
].map((row) => row.map(csvCell).join(",")).join("\r\n");

export const climateVariableLabel = (variable: ClimateVariable | undefined): string =>
  variable?.name || "Climate indicator";

export const normalizeOverviewQuery = (
  search: string,
  districts: IdentifiedItem[] = [],
): string => {
  const candidate = new URLSearchParams(search).get("district");
  const districtIds = new Set(districts.map(({ id }) => id));

  if (candidate && districtIds.has(candidate)) return candidate;
  if (districtIds.has(DASHBOARD_DEFAULTS.district)) return DASHBOARD_DEFAULTS.district;
  return districts[0]?.id || DASHBOARD_DEFAULTS.district;
};

export const overviewQueryString = (districtId: string): string =>
  new URLSearchParams({ district: districtId }).toString();
