import { lazy, Suspense, useEffect, useMemo } from "react";
import { useDistrictChartSeries } from "../../hooks/useDistrictChartSeries";
import { useClimateData, useClimateVariables, useDistrictList } from "../../hooks/useClimateData";
import type { Scenario } from "../../types/climate";
import { normalizeUnit } from "../../utils/colorScales";
import { ChartSkeleton, DashboardResultsSkeleton } from "../Loading/SkeletonLoaders";
import {
  anomalyFromReference,
  DASHBOARD_MAX_YEAR,
  DASHBOARD_MIN_YEAR,
  DASHBOARD_PARAMETER_LABELS,
  DASHBOARD_TIME_SCALE_LABELS,
  dashboardQueryString,
  dashboardDistrictForParameter,
  dashboardDistrictOptions,
  dashboardScenarioOptions,
  dashboardSelectionFromVariable,
  dashboardTimeScaleOptions,
  dashboardVariableForSelection,
  filterDashboardSeries,
  isDashboardVariable,
  navigate,
  normalizeDashboardQuery,
  type DashboardParameter,
  type DashboardQueryState,
  type DashboardTimeScale,
} from "../../utils/publicRouting";
import AtlasIcon from "./AtlasIcon";
import RouteLink from "./RouteLink";

// Highcharts is heavy, so it loads with the first chart rather than with the site.
const DashboardChart = lazy(() => import("./DashboardChart"));

interface DashboardPageProps {
  search: string;
}

const SCENARIO_LABELS: Record<Scenario, string> = {
  rcp26: "Low emissions · RCP2.6",
  rcp45: "Medium emissions · RCP4.5",
  rcp85: "High emissions · RCP8.5",
  ssp126: "Low emissions · SSP1-2.6",
  ssp245: "Medium emissions · SSP2-4.5",
  ssp585: "High emissions · SSP5-8.5",
};

const SCENARIO_SHORT_LABELS: Record<Scenario, string> = {
  rcp26: "RCP2.6",
  rcp45: "RCP4.5",
  rcp85: "RCP8.5",
  ssp126: "SSP1-2.6",
  ssp245: "SSP2-4.5",
  ssp585: "SSP5-8.5",
};

const YEAR_OPTIONS = Array.from(
  { length: DASHBOARD_MAX_YEAR - DASHBOARD_MIN_YEAR + 1 },
  (_, index) => DASHBOARD_MIN_YEAR + index,
);

const formatMetric = (value: number, unit: string) => {
  const decimals = unit === "m" ? 2 : unit.includes("C") ? 1 : 0;
  const rendered = unit.includes("mm")
    ? Math.round(value).toLocaleString()
    : value.toFixed(decimals);
  return `${rendered}${unit ? ` ${unit}` : ""}`;
};


const DashboardPage = ({ search }: DashboardPageProps) => {
  // Names only: the dropdown needs no boundary geometry.
  const districtsQuery = useDistrictList();
  const variablesQuery = useClimateVariables();

  const districts = useMemo(
    () => [...(districtsQuery.data ?? [])].sort((a, b) => a.name.localeCompare(b.name)),
    [districtsQuery.data],
  );
  const variables = useMemo(
    () => (variablesQuery.data ?? []).filter(({ id }) => isDashboardVariable(id)),
    [variablesQuery.data],
  );
  const normalizedState = useMemo(
    () => normalizeDashboardQuery(search, districts, variables),
    [districts, search, variables],
  );
  const normalizedSelection = dashboardSelectionFromVariable(normalizedState.variable);
  const seaLevelAvailabilityQuery = useClimateData(
    "sea_level_rise",
    "2080",
    "ssp245",
    normalizedSelection.parameter === "sea-level",
  );
  const seaLevelDistrictIds = useMemo(
    () => seaLevelAvailabilityQuery.data
      ? new Set(seaLevelAvailabilityQuery.data.data.map(({ district_id }) => district_id))
      : null,
    [seaLevelAvailabilityQuery.data],
  );
  const selectableDistricts = useMemo(
    () => dashboardDistrictOptions(districts, normalizedSelection.parameter, seaLevelDistrictIds),
    [districts, normalizedSelection.parameter, seaLevelDistrictIds],
  );
  const state = useMemo(() => {
    const district = dashboardDistrictForParameter(
      normalizedState.district,
      normalizedSelection.parameter,
      selectableDistricts,
    );
    return district === normalizedState.district
      ? normalizedState
      : { ...normalizedState, district };
  }, [normalizedSelection.parameter, normalizedState, selectableDistricts]);
  const selection = dashboardSelectionFromVariable(state.variable);
  const seaLevelAvailabilityReady = normalizedSelection.parameter !== "sea-level"
    || seaLevelAvailabilityQuery.data !== undefined;

  useEffect(() => {
    if (!districtsQuery.isSuccess || !variablesQuery.isSuccess || !seaLevelAvailabilityReady) return;
    const canonical = dashboardQueryString(state);
    if (new URLSearchParams(search).toString() !== canonical) {
      navigate(`/dashboard?${canonical}`, { replace: true });
    }
  }, [districtsQuery.isSuccess, search, seaLevelAvailabilityReady, state, variablesQuery.isSuccess]);

  const metadataReady = districtsQuery.isSuccess
    && variablesQuery.isSuccess
    && districts.length > 0
    && variables.length > 0
    && seaLevelAvailabilityReady;
  const seriesQuery = useDistrictChartSeries(
    state.district,
    state.variable,
    state.scenario,
    metadataReady,
  );
  const series = seriesQuery.series;
  const filtered = useMemo(
    () => filterDashboardSeries(series?.data ?? [], state.from, state.to),
    [series, state.from, state.to],
  );
  const anomaly = useMemo(
    () => anomalyFromReference(filtered, series?.reference_mean ?? 0),
    [filtered, series?.reference_mean],
  );

  const updateState = (changes: Partial<DashboardQueryState>) => {
    const candidate = { ...state, ...changes };
    const normalized = normalizeDashboardQuery(
      `?${dashboardQueryString(candidate)}`,
      districts,
      variables,
    );
    navigate(`/dashboard?${dashboardQueryString(normalized)}`);
  };

  const selectedVariable = variables.find(({ id }) => id === state.variable);
  const selectedDistrict = districts.find(({ id }) => id === state.district);
  const scenarioOptions = dashboardScenarioOptions(state.variable);
  const allTimeScaleOptions = dashboardTimeScaleOptions(selection.parameter);
  const availableTimeScaleOptions = variables.length
    ? allTimeScaleOptions.filter((timeScale) => variables.some(
      ({ id }) => id === dashboardVariableForSelection(selection.parameter, timeScale),
    ))
    : allTimeScaleOptions;
  const unit = normalizeUnit(series?.unit || selectedVariable?.unit || "");
  const parameterLabel = DASHBOARD_PARAMETER_LABELS[selection.parameter];
  const timeScaleLabel = DASHBOARD_TIME_SCALE_LABELS[selection.timeScale];
  const absoluteTitle = selection.parameter === "sea-level"
    ? "Projected Sea Level Rise"
    : `Average ${timeScaleLabel} ${parameterLabel}`;
  const anomalyTitle = selection.parameter === "sea-level"
    ? "Sea Level Rise from Reference"
    : `${parameterLabel} Anomaly`;
  const referencePeriod = series
    ? `${series.reference_period.start}–${series.reference_period.end}`
    : "1991–2020";
  const isMetadataLoading = districtsQuery.isLoading
    || variablesQuery.isLoading
    || (normalizedSelection.parameter === "sea-level" && seaLevelAvailabilityQuery.isLoading);
  const metadataError = districtsQuery.error
    || variablesQuery.error
    || (normalizedSelection.parameter === "sea-level" ? seaLevelAvailabilityQuery.error : null);
  const metadataEmpty = districtsQuery.isSuccess
    && variablesQuery.isSuccess
    && (!districts.length
      || !variables.length
      || (normalizedSelection.parameter === "sea-level"
        && seaLevelAvailabilityQuery.data !== undefined
        && !selectableDistricts.length));

  const updateParameter = (parameter: DashboardParameter) => {
    const compatibleScale = dashboardTimeScaleOptions(parameter).includes(selection.timeScale)
      ? selection.timeScale
      : "annual";
    updateState({ variable: dashboardVariableForSelection(parameter, compatibleScale) });
  };

  const updateTimeScale = (timeScale: DashboardTimeScale) => {
    updateState({ variable: dashboardVariableForSelection(selection.parameter, timeScale) });
  };

  return (
    <main id="main-content" className="public-main dashboard-page">
      <section className="dashboard-controls-panel" aria-labelledby="dashboard-controls-title">
        <div className="public-container">
          <h1 id="dashboard-controls-title" className="visually-hidden">Climate projections dashboard</h1>
          <div className="dashboard-controls-grid">
            <label>
              <span>Parameter</span>
              <select
                aria-label="Parameter"
                value={selection.parameter}
                onChange={(event) => updateParameter(event.target.value as DashboardParameter)}
                disabled={isMetadataLoading || Boolean(metadataError)}
              >
                {(Object.keys(DASHBOARD_PARAMETER_LABELS) as DashboardParameter[]).map((parameter) => (
                  <option key={parameter} value={parameter}>{DASHBOARD_PARAMETER_LABELS[parameter]}</option>
                ))}
              </select>
            </label>
            <label>
              <span>Time Scale</span>
              <select
                aria-label="Time Scale"
                value={selection.timeScale}
                onChange={(event) => updateTimeScale(event.target.value as DashboardTimeScale)}
                disabled={isMetadataLoading || Boolean(metadataError)}
              >
                {availableTimeScaleOptions.map((timeScale) => (
                  <option key={timeScale} value={timeScale}>{DASHBOARD_TIME_SCALE_LABELS[timeScale]}</option>
                ))}
              </select>
            </label>
            <fieldset className="dashboard-year-control">
              <legend>Date Range</legend>
              <div>
                <select
                  aria-label="Start Year"
                  value={state.from}
                  onChange={(event) => updateState({ from: Number(event.target.value) })}
                >
                  {YEAR_OPTIONS.map((year) => <option key={year} value={year}>{year}</option>)}
                </select>
                <span aria-hidden="true">to</span>
                <select
                  aria-label="End Year"
                  value={state.to}
                  onChange={(event) => updateState({ to: Number(event.target.value) })}
                >
                  {YEAR_OPTIONS.map((year) => <option key={year} value={year}>{year}</option>)}
                </select>
              </div>
            </fieldset>
            <label>
              <span>{selection.parameter === "sea-level" ? "Coastal District" : "District"}</span>
              <select
                aria-label="District"
                value={state.district}
                onChange={(event) => updateState({ district: event.target.value })}
                disabled={isMetadataLoading || Boolean(metadataError)}
              >
                {selectableDistricts.length === 0 && (
                  <option value={state.district}>
                    {selection.parameter === "sea-level" ? "Loading coastal districts…" : "Loading districts…"}
                  </option>
                )}
                {selectableDistricts.map((district) => (
                  <option key={district.id} value={district.id}>{district.name} · {district.region}</option>
                ))}
              </select>
            </label>
            <label>
              <span>Emissions Scenario</span>
              <select
                aria-label="Emissions Scenario"
                value={state.scenario}
                onChange={(event) => updateState({ scenario: event.target.value as Scenario })}
              >
                {scenarioOptions.map((scenario) => (
                  <option key={scenario} value={scenario}>{SCENARIO_LABELS[scenario]}</option>
                ))}
              </select>
            </label>
          </div>
        </div>
      </section>

      <section className="dashboard-workspace public-container" aria-live="polite">
        {(metadataError || metadataEmpty) && (
          <div className="public-status public-status--error" role="alert">
            <h2>We couldn’t load the dashboard controls</h2>
            <p>Check your connection and try again.</p>
            <button type="button" onClick={() => {
              void districtsQuery.refetch();
              void variablesQuery.refetch();
              if (normalizedSelection.parameter === "sea-level") void seaLevelAvailabilityQuery.refetch();
            }}>Try again</button>
          </div>
        )}

        {!metadataError && !metadataEmpty && (isMetadataLoading || seriesQuery.isLoading) && (
          <DashboardResultsSkeleton label="Loading district climate projections…" />
        )}

        {seriesQuery.isError && (
          <div className="public-status public-status--error" role="alert">
            <h2>Projection data is temporarily unavailable</h2>
            <p>The atlas service did not return a time series for this view.</p>
            <button type="button" onClick={() => void seriesQuery.refetch()}>Try again</button>
          </div>
        )}

        {seriesQuery.isSuccess && filtered.length === 0 && (
          <div className="public-status"><h2>No yearly values in this range</h2><p>Choose a wider year range or another parameter.</p></div>
        )}

        {seriesQuery.isSuccess && series && filtered.length > 0 && (
          <div className="dashboard-results">
            <div className="dashboard-selection-bar">
              <p>
                <strong>{selectedDistrict?.name || series.district_name}</strong>
                <span>{timeScaleLabel} · {SCENARIO_LABELS[state.scenario]} · {state.from}–{state.to}</span>
              </p>
              <div className="dashboard-result-actions">
                <RouteLink className="text-link" to={`/map?variable=${encodeURIComponent(state.variable)}&scenario=${state.scenario}&district=${encodeURIComponent(state.district)}&period=2080`}>
                  View on map <AtlasIcon name="arrow" size={15} />
                </RouteLink>
              </div>
            </div>

            <section className="dashboard-content-row" aria-labelledby="absolute-chart-title">
              <div className="dashboard-narrative">
                <p className="section-kicker">Projected climate</p>
                <h2 id="absolute-chart-title">{absoluteTitle}</h2>
                {selection.parameter === "sea-level" ? (
                  <p>Each vertical interval spans p10–p90 across the model ensemble at a representative year; the diamond marks the p50 median. These are projection percentiles, not sample quartiles.</p>
                ) : (
                  <p>The median line shows the central model estimate for each year. The shaded p10–p90 band shows the spread across the climate model ensemble.</p>
                )}
                <dl className="dashboard-narrative__facts">
                  <div><dt>Location</dt><dd>{selectedDistrict?.name || series.district_name}</dd></div>
                  <div><dt>Scenario</dt><dd>{SCENARIO_SHORT_LABELS[state.scenario]}</dd></div>
                  <div><dt>Reference period</dt><dd>{referencePeriod}</dd></div>
                </dl>
              </div>
              <article className="dashboard-chart-card" aria-label={`${absoluteTitle} chart`}>
                <div className="chart-card-heading">
                  <div>
                    <h3>{absoluteTitle}</h3>
                    <p>{selection.parameter === "sea-level"
                      ? "Ensemble interval plot · p10–p90 with p50 median"
                      : "Median projection with p10–p90 uncertainty"}</p>
                  </div>
                  <span>{state.from}–{state.to}</span>
                </div>
                <Suspense fallback={<ChartSkeleton height={360} />}>
                  <DashboardChart data={filtered} unit={unit} label={absoluteTitle} scenarioLabel={SCENARIO_LABELS[state.scenario]} parameter={selection.parameter} />
                </Suspense>
              </article>
            </section>

            <section className="dashboard-content-row" aria-labelledby="anomaly-chart-title">
              <div className="dashboard-narrative">
                <p className="section-kicker">Change from reference</p>
                <h2 id="anomaly-chart-title">{anomalyTitle}</h2>
                <p>Each percentile is shown relative to the backend reference mean. Values above zero are higher than the {referencePeriod} climate reference; values below zero are lower.</p>
                <div className="dashboard-reference-value">
                  <span>Reference mean</span>
                  <strong>{formatMetric(series.reference_mean, unit)}</strong>
                  <small>{referencePeriod}</small>
                </div>
              </div>
              <article className="dashboard-chart-card" aria-label={`${anomalyTitle} chart`}>
                <div className="chart-card-heading">
                  <div>
                    <h3>{anomalyTitle}</h3>
                    <p>{selection.parameter === "sea-level"
                      ? "Median projection with p10–p90 uncertainty range"
                      : "Split-color median with a subtle p10–p90 ensemble range"}</p>
                  </div>
                  <span>Zero = reference mean</span>
                </div>
                <Suspense fallback={<ChartSkeleton height={360} />}>
                  <DashboardChart data={anomaly} unit={unit} label={anomalyTitle} scenarioLabel={SCENARIO_LABELS[state.scenario]} parameter={selection.parameter} anomaly />
                </Suspense>
              </article>
            </section>

            <p className="dashboard-method-note">{selection.parameter === "sea-level"
              ? "The interval chart highlights representative years. The anomaly chart shows the annual p50 change from the reference mean, while the shaded ribbon spans p10–p90 across the model ensemble."
              : "The line is the ensemble median (p50). Shading spans p10–p90 to communicate projection uncertainty; it is not a forecast confidence interval."}</p>
          </div>
        )}
      </section>
    </main>
  );
};

export default DashboardPage;
