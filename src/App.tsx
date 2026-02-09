// Ghana Climate Atlas - Main Application (Redesigned UI)

import { useState, useMemo, useCallback } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import GhanaMap from "./components/Map/GhanaMap";
import Header from "./components/Header/Header";
import MapLayerToggles from "./components/Sidebar/MapLayerToggles";
import TimelineBar from "./components/Timeline/TimelineBar";
import CategoryTabs, { type Category } from "./components/Categories/CategoryTabs";
import DistrictDetailPanel from "./components/InfoPanel/DistrictDetailPanel";
import DistrictSearch from "./components/Search/DistrictSearch";
import {
  useDistricts,
  useClimateVariables,
  useClimateData,
  useClimateComparison,
  useClimateRange,
} from "./hooks/useClimateData";
import { useMapControls } from "./hooks/useMapControls";
import type { ColorScaleType } from "./utils/colorScales";
import type { Scenario, Period } from "./types/climate";
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
  const [showGrid, setShowGrid] = useState(false);
  const [showAverage, setShowAverage] = useState(false);
  const [showCities, setShowCities] = useState(true);

  // Category tab state
  const [activeCategory, setActiveCategory] = useState<Category>("temperature");
  const [selectedParameterLabel, setSelectedParameterLabel] = useState<string | null>(null);
  const [selectedParameterDescription, setSelectedParameterDescription] = useState<string | null>(null);

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

  const handleParameterSelect = useCallback((variableId: string) => {
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
  const { data: rangeData } = useClimateRange(variable, period, scenario);

  // Get current variable info
  const currentVariable = useMemo(
    () => variables?.find((v) => v.id === variable),
    [variables, variable]
  );

  // Calculate min/max for color scale
  const { minValue, maxValue } = useMemo(() => {
    if (showChange && comparisonData) {
      const changes = comparisonData.data.map((d) => d.change);
      const absMax = Math.max(...changes.map(Math.abs));
      return { minValue: -absMax, maxValue: absMax };
    }
    if (rangeData) {
      return { minValue: rangeData.min, maxValue: rangeData.max };
    }
    return { minValue: 0, maxValue: 100 };
  }, [rangeData, comparisonData, showChange]);

  // Get color scale type
  const colorScaleType: ColorScaleType = useMemo(() => {
    if (showChange) return "diverging";
    return (currentVariable?.color_scale as ColorScaleType) || "temperature";
  }, [currentVariable, showChange]);

  return (
    <div className="climate-atlas-redesign">
      {/* Header with Legend */}
      <Header
        variable={currentVariable}
        period={period}
        scenario={scenario}
        minValue={minValue}
        maxValue={maxValue}
        colorScaleType={colorScaleType}
        showChange={showChange}
        parameterLabel={selectedParameterLabel}
        parameterDescription={selectedParameterDescription}
      />

      {/* Map container - full bleed with all floating overlays inside */}
      <div className="map-container">
        {/* Map area */}
        <div className="map-area">
          {districtsError && (
            <div className="error-overlay">
              <div className="error-content">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <h3>Unable to load map data</h3>
                <p>Please ensure the backend server is running on port 8000</p>
                <button className="retry-btn" onClick={() => refetchDistricts()}>
                  Retry
                </button>
              </div>
            </div>
          )}

          {/* Full blocking overlay only on initial load */}
          {(loadingDistricts || (loadingClimate && !climateData)) && !districtsError && (
            <div className="loading-overlay">
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
            climateData={climateData?.data}
            comparisonData={comparisonData?.data}
            showChange={showChange}
            colorScaleType={colorScaleType}
            minValue={minValue}
            maxValue={maxValue}
            selectedDistrictId={selectedDistrictId}
            onDistrictClick={selectDistrict}
            onDistrictHover={setHoveredDistrict}
            showCities={showCities}
            dataVersion={`${variable}-${period}-${scenario}-${showChange}`}
            showGrid={showGrid}
          />
        </div>

        {/* Floating sidebar with layer toggles + search */}
        <MapLayerToggles
          showGrid={showGrid}
          showAverage={showAverage}
          showCities={showCities}
          onToggleGrid={() => setShowGrid(!showGrid)}
          onToggleAverage={() => setShowAverage(!showAverage)}
          onToggleCities={() => setShowCities(!showCities)}
          searchContent={
            <DistrictSearch
              districts={districts}
              onSelectDistrict={selectDistrict}
            />
          }
        />

        {/* Show change toggle */}
        {period !== "baseline" && (
          <div className="change-toggle-overlay">
            <label className="change-toggle">
              <input
                type="checkbox"
                checked={showChange}
                onChange={toggleShowChange}
              />
              <span>Show change from baseline</span>
            </label>
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
          const districtComparison = panelComparisonData?.data.find(
            (d) => d.district_id === selectedDistrictId
          );

          // Find baseline value from climate data
          const baselineValue = climateData?.data.find(
            (d) => d.district_id === selectedDistrictId
          )?.value;

          return (
            <DistrictDetailPanel
              districtId={selectedDistrictId}
              districtName={districtName}
              regionName={regionName}
              variable={variable}
              variableInfo={currentVariable}
              scenario={scenario as Scenario}
              period={period as Period}
              comparisonData={districtComparison}
              baselineValue={baselineValue}
              onClose={() => selectDistrict(null)}
            />
          );
        })()}

        {/* Bottom control bar - timeline + category tabs */}
        <div className="bottom-control-bar">
          <TimelineBar
            selectedPeriod={period}
            onPeriodChange={setPeriod}
            scenario={scenario}
            onScenarioChange={setScenario}
          />
          <CategoryTabs
            activeCategory={activeCategory}
            onCategoryChange={setActiveCategory}
            onParameterSelect={handleParameterSelect}
            onParameterLabelChange={setSelectedParameterLabel}
            onParameterDescriptionChange={setSelectedParameterDescription}
            scenario={scenario as Scenario}
            period={period as Period}
          />
        </div>
      </div>
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
