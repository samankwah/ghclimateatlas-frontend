// Ghana Climate Atlas - Main Application (Redesigned UI)

import { useState, useMemo, useCallback, useEffect, lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import GhanaMap from "./components/Map/GhanaMap";
import Legend from "./components/Map/Legend";
import Header from "./components/Header/Header";
import MapLayerToggles from "./components/Sidebar/MapLayerToggles";
import TimelineBar from "./components/Timeline/TimelineBar";
import CategoryTabs, { type Category } from "./components/Categories/CategoryTabs";
import DistrictSearch from "./components/Search/DistrictSearch";

const DistrictDetailPanel = lazy(() => import("./components/InfoPanel/DistrictDetailPanel"));
const HelpOverlay = lazy(() => import("./components/Help/HelpOverlay"));
const TourOverlay = lazy(() => import("./components/Tour/TourOverlay"));
import {
  useDistricts,
  useClimateVariables,
  useClimateData,
  useClimateComparison,
} from "./hooks/useClimateData";
import { buildRangeFromClimateResponse } from "./utils/derivedClimate";
import { useMapControls } from "./hooks/useMapControls";
import type { ColorScaleType } from "./utils/colorScales";
import type { Scenario, Period } from "./types/climate";
import {
  getPeriodRangeLabel,
  getScenarioLabel,
  isSeaLevelVariableId,
} from "./utils/climateLabels";
import { getFixedDisplayRange } from "./utils/displayRanges";
import "./App.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

function ClimateAtlas() {
  const [, setHoveredDistrict] = useState<string | null>(null);

  // Map layer toggles state
  const [showGrid] = useState(true);
  const [showCities] = useState(true);
  const [showWater, setShowWater] = useState(true);
  const [showStories, setShowStories] = useState(true);
  const [mobileControlsOpen, setMobileControlsOpen] = useState(false);
  const [mobileHeaderActionsOpen, setMobileHeaderActionsOpen] = useState(false);
  const [mobileChangeToggleOpen, setMobileChangeToggleOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [tourOpen, setTourOpen] = useState(false);

  // Category tab state
  const [activeCategory, setActiveCategory] = useState<Category>("temperature");
  const [selectedParameterId, setSelectedParameterId] = useState<string | null>(null);
  const [selectedParameterLabel, setSelectedParameterLabel] = useState<string | null>(null);

  // Map controls state
  const {
    variable,
    period,
    scenario,
    selectedDistrictId,
    showChange,
    setVariable,
    setPeriod,
    setScenario,
    selectDistrict,
    toggleShowChange,
  } = useMapControls();

  const handleParameterSelect = useCallback((variableId: string, parameterId: string) => {
    setSelectedParameterId(parameterId);
    setVariable(variableId);
  }, [setVariable]);


  // Data fetching
  const { data: districts, isLoading: loadingDistricts, isError: districtsError, refetch: refetchDistricts } = useDistricts();
  const { data: variables } = useClimateVariables();
  const { data: climateData, isLoading: loadingClimate, isFetching: fetchingClimate } = useClimateData(
    variable,
    period,
    scenario
  );
  const { data: comparisonData } = useClimateComparison(variable, period, scenario);
  // Always fetch 2080 comparison for panel display (regardless of map period)
  const { data: panelComparisonData } = useClimateComparison(variable, "2080", scenario);
  const rangeData = useMemo(
    () => buildRangeFromClimateResponse(climateData),
    [climateData]
  );

  // Get current variable info
  const currentVariable = useMemo(
    () => variables?.find((v) => v.id === variable),
    [variables, variable]
  );

  const effectiveVariable = useMemo(() => {
    if (!currentVariable) return currentVariable;

    if (selectedParameterId === "wet_days") {
      return {
        ...currentVariable,
        id: "wet_days",
        name: "Wet Days",
        description: "Number of days per year with measurable precipitation",
        unit: "days",
        color_scale: "precipitation",
      };
    }

    return currentVariable;
  }, [currentVariable, selectedParameterId]);

  const displayedClimateData = useMemo(() => {
    if (!climateData?.data) return climateData?.data;
    if (selectedParameterId !== "wet_days") return climateData.data;

    return climateData.data.map((entry) => ({
      ...entry,
      value: Math.max(0, 365 - entry.value),
    }));
  }, [climateData, selectedParameterId]);

  const displayedComparisonData = useMemo(() => {
    if (!comparisonData?.data) return comparisonData?.data;
    if (selectedParameterId !== "wet_days") return comparisonData.data;

    return comparisonData.data.map((entry) => {
      const baseline = Math.max(0, 365 - entry.baseline);
      const future = Math.max(0, 365 - entry.future);
      const change = future - baseline;
      const changePercent = baseline !== 0 ? (change / baseline) * 100 : 0;

      return {
        ...entry,
        baseline,
        future,
        change,
        change_percent: changePercent,
      };
    });
  }, [comparisonData, selectedParameterId]);

  const displayedPanelComparisonData = useMemo(() => {
    if (!panelComparisonData?.data) return panelComparisonData?.data;
    if (selectedParameterId !== "wet_days") return panelComparisonData.data;

    return panelComparisonData.data.map((entry) => {
      const baseline = Math.max(0, 365 - entry.baseline);
      const future = Math.max(0, 365 - entry.future);
      const change = future - baseline;
      const changePercent = baseline !== 0 ? (change / baseline) * 100 : 0;

      return {
        ...entry,
        baseline,
        future,
        change,
        change_percent: changePercent,
      };
    });
  }, [panelComparisonData, selectedParameterId]);

  const displayedRangeData = useMemo(() => {
    if (!rangeData) return rangeData;
    if (selectedParameterId !== "wet_days") return rangeData;

    return {
      min: Math.max(0, 365 - rangeData.max),
      max: Math.max(0, 365 - rangeData.min),
      mean: Math.max(0, 365 - rangeData.mean),
    };
  }, [rangeData, selectedParameterId]);

  const fixedDisplayRange = useMemo(() => {
    if (showChange || !effectiveVariable) {
      return undefined;
    }

    if (selectedParameterId === "wet_days") {
      return { min: 0, max: 365 };
    }

    return getFixedDisplayRange(effectiveVariable.id, effectiveVariable.color_scale);
  }, [effectiveVariable, selectedParameterId, showChange]);

  // Calculate min/max for color scale
  const { minValue, maxValue } = useMemo(() => {
    if (showChange && displayedComparisonData) {
      const changes = displayedComparisonData.map((d) => d.change);
      const absMax = Math.max(...changes.map(Math.abs));
      return { minValue: -absMax, maxValue: absMax };
    }
    if (fixedDisplayRange) {
      return { minValue: fixedDisplayRange.min, maxValue: fixedDisplayRange.max };
    }
    if (displayedRangeData) {
      return { minValue: displayedRangeData.min, maxValue: displayedRangeData.max };
    }
    return { minValue: 0, maxValue: 100 };
  }, [displayedRangeData, displayedComparisonData, fixedDisplayRange, showChange]);

  // Get color scale type
  const colorScaleType: ColorScaleType = useMemo(() => {
    if (showChange) return "diverging";
    return (effectiveVariable?.color_scale as ColorScaleType) || "temperature";
  }, [effectiveVariable, showChange]);

  const handleOpenHelp = useCallback(() => {
    setMobileHeaderActionsOpen(false);
    setTourOpen(false);
    setHelpOpen(true);
  }, []);

  const handleOpenTour = useCallback(() => {
    setMobileHeaderActionsOpen(false);
    setHelpOpen(false);
    setTourOpen(true);
  }, []);


  useEffect(() => {
    const variableLabel =
      selectedParameterLabel?.trim() ||
      effectiveVariable?.name ||
      "Climate Atlas";

    const districtName =
      selectedDistrictId
        ? districts?.features.find((f) => f.properties.id === selectedDistrictId)?.properties.name
        : null;
    const scenarioTitle =
      period === "baseline"
        ? "Historical"
        : isSeaLevelVariableId(effectiveVariable?.id)
          ? scenario.toUpperCase()
          : getScenarioLabel(scenario);

    document.title = districtName
      ? `${districtName} | ${variableLabel} | ${scenarioTitle} ${getPeriodRangeLabel(period)} | Ghana Climate Atlas`
      : `${variableLabel} | ${scenarioTitle} ${getPeriodRangeLabel(period)} | Ghana Climate Atlas`;
  }, [
    districts,
    effectiveVariable,
    period,
    scenario,
    selectedDistrictId,
    selectedParameterLabel,
  ]);

  return (
    <div className="climate-atlas-redesign">
      {/* Header with Legend */}
      <Header
        variable={effectiveVariable}
        period={period}
        scenario={scenario}
        minValue={minValue}
        maxValue={maxValue}
        colorScaleType={colorScaleType}
        showChange={showChange}
        parameterLabel={selectedParameterLabel}
        mobileActionsOpen={mobileHeaderActionsOpen}
        onToggleMobileActions={() => setMobileHeaderActionsOpen((open) => !open)}
        onOpenHelp={handleOpenHelp}
        onOpenTour={handleOpenTour}
        onCloseMobileActions={() => setMobileHeaderActionsOpen(false)}
      />

      {/* Map container - full bleed with all floating overlays inside */}
      <div className="map-container">
        {/* Map area */}
        <div className="map-area">
          <Legend
            variable={effectiveVariable}
            minValue={minValue}
            maxValue={maxValue}
            colorScaleType={colorScaleType}
            showChange={showChange}
            className="floating-map-legend"
            floating
          />

          {districtsError && (
            <div className="error-overlay">
              <div className="error-content">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <h3>Unable to load map data</h3>
                <p>Could not connect to the server. Please try again later.</p>
                <button className="retry-btn" onClick={() => refetchDistricts()}>
                  Retry
                </button>
              </div>
            </div>
          )}

          {/* Loading overlay scoped to map area only — header + controls remain visible */}
          {(loadingDistricts || (loadingClimate && !climateData)) && !districtsError && (
            <div className="map-loading-overlay">
              <div className="spinner" />
              <p>Loading climate data...</p>
            </div>
          )}

          {/* Subtle top-bar indicator while fetching new data in background */}
          {fetchingClimate && climateData && (
            <div className="fetching-indicator" />
          )}

          <GhanaMap
            districts={districts}
            climateData={displayedClimateData}
            comparisonData={displayedComparisonData}
            showChange={showChange}
            activeVariableId={variable}
            colorScaleType={colorScaleType}
            minValue={minValue}
            maxValue={maxValue}
            selectedDistrictId={selectedDistrictId}
            onDistrictClick={selectDistrict}
            onDistrictHover={setHoveredDistrict}
            showCities={showCities}
            unit={effectiveVariable?.unit || ""}
            dataVersion={`${variable}-${period}-${scenario}`}
            showGrid={showGrid}
            showWater={showWater}
            showStories={showStories}
          />
        </div>

        {/* Floating sidebar with layer toggles + search */}
        <MapLayerToggles
          showStories={showStories}
          showWater={showWater}
          onToggleWater={() => setShowWater(!showWater)}
          onToggleStories={() => setShowStories(!showStories)}
          searchContent={
            <DistrictSearch
              districts={districts}
              onSelectDistrict={selectDistrict}
            />
          }
        />

        {/* Show change toggle */}
        {period !== "baseline" && (
          <div className={`change-toggle-overlay ${mobileChangeToggleOpen ? "mobile-open" : ""}`}>
            <button
              type="button"
              className={`change-toggle-mobile-trigger ${showChange ? "active" : ""}`}
              onClick={() => setMobileChangeToggleOpen((current) => !current)}
              aria-expanded={mobileChangeToggleOpen}
              aria-controls="change-toggle-panel"
            >
            </button>
            <div
              id="change-toggle-panel"
              className="change-toggle-panel"
            >
              <label className="change-toggle">
                <input
                  type="checkbox"
                  checked={showChange}
                  onChange={toggleShowChange}
                />
                <span>Show change from baseline</span>
              </label>
            </div>
          </div>
        )}

        {/* District detail panel (sliding side panel) */}
        {selectedDistrictId && (() => {
          // Find district info from GeoJSON
          const districtFeature = districts?.features.find(
            (f) => f.properties.id === selectedDistrictId
          );
          const districtName = districtFeature?.properties.name || selectedDistrictId;
          const regionName = districtFeature?.properties.region || "Ghana";

          // Find comparison data for this district (use panel comparison data which always fetches 2080)
          const districtComparison = displayedPanelComparisonData?.find(
            (d) => d.district_id === selectedDistrictId
          );

          // Find baseline value from climate data
          const baselineValue = displayedClimateData?.find(
            (d) => d.district_id === selectedDistrictId
          )?.value;

          return (
            <Suspense fallback={<div className="loading-overlay"><div className="spinner" /></div>}>
              <DistrictDetailPanel
                districtId={selectedDistrictId}
                districtName={districtName}
                regionName={regionName}
                variable={variable}
                variableInfo={effectiveVariable}
                scenario={scenario as Scenario}
                period={period as Period}
                comparisonData={districtComparison}
                baselineValue={baselineValue}
                onClose={() => selectDistrict(null)}
              />
            </Suspense>
          );
        })()}

      </div>

      {/* Bottom control bar */}
      <div className={`bottom-control-bar ${mobileControlsOpen ? "mobile-expanded" : "mobile-collapsed"}`}>
        <button
          className="mobile-panel-toggle"
          onClick={() => setMobileControlsOpen((o) => !o)}
          aria-label={mobileControlsOpen ? "Collapse controls" : "Expand controls"}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 12 12 6 18 12" />
            <polyline points="6 18 12 12 18 18" />
          </svg>
        </button>
        <div className="bottom-control-content">
          <TimelineBar
            selectedPeriod={period}
            onPeriodChange={setPeriod}
            variableId={variable}
            scenario={scenario}
            onScenarioChange={setScenario}
          />
          <CategoryTabs
            activeCategory={activeCategory}
            onCategoryChange={setActiveCategory}
            onParameterSelect={handleParameterSelect}
            onParameterLabelChange={setSelectedParameterLabel}
            scenario={scenario as Scenario}
            period={period as Period}
            availableVariables={variables}
            controlsExpanded={mobileControlsOpen}
          />
        </div>
      </div>

      {helpOpen && (
        <Suspense fallback={null}>
          <HelpOverlay onClose={() => setHelpOpen(false)} onStartTour={handleOpenTour} />
        </Suspense>
      )}
      {tourOpen && (
        <Suspense fallback={null}>
          <TourOverlay onClose={() => setTourOpen(false)} />
        </Suspense>
      )}
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ClimateAtlas />
    </QueryClientProvider>
  );
}

export default App;
