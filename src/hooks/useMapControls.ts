// Map controls state management

import { useEffect, useState, useCallback } from "react";
import type { Period, Scenario, MapState } from "../types/climate";

const DEFAULT_STATE: MapState = {
  variable: "annual_mean_temp",
  period: "baseline",
  scenario: "rcp45",
  selectedDistrictId: null,
  showChange: false,
};

const PERIOD_VALUES: Period[] = ["baseline", "2030", "2050", "2080"];
const SCENARIO_VALUES: Scenario[] = ["rcp26", "rcp45", "rcp85"];

const getInitialState = (): MapState => {
  if (typeof window === "undefined") {
    return DEFAULT_STATE;
  }

  const params = new URLSearchParams(window.location.search);
  const periodParam = params.get("period");
  const scenarioParam = params.get("scenario");

  const period = PERIOD_VALUES.includes(periodParam as Period)
    ? (periodParam as Period)
    : DEFAULT_STATE.period;
  const scenario = SCENARIO_VALUES.includes(scenarioParam as Scenario)
    ? (scenarioParam as Scenario)
    : DEFAULT_STATE.scenario;

  return {
    variable: params.get("variable") || DEFAULT_STATE.variable,
    period,
    scenario,
    selectedDistrictId: params.get("district") || null,
    showChange: period !== "baseline" && params.get("change") === "1",
  };
};

export const useMapControls = () => {
  const [state, setState] = useState<MapState>(getInitialState);

  const setVariable = useCallback((variable: string) => {
    setState((prev) => ({ ...prev, variable }));
  }, []);

  const setPeriod = useCallback((period: Period) => {
    setState((prev) => ({
      ...prev,
      period,
      // Reset showChange if going back to baseline
      showChange: period === "baseline" ? false : prev.showChange,
    }));
  }, []);

  const setScenario = useCallback((scenario: Scenario) => {
    setState((prev) => ({ ...prev, scenario }));
  }, []);

  const selectDistrict = useCallback((districtId: string | null) => {
    setState((prev) => ({ ...prev, selectedDistrictId: districtId }));
  }, []);

  const toggleShowChange = useCallback(() => {
    setState((prev) => ({
      ...prev,
      showChange: prev.period !== "baseline" ? !prev.showChange : false,
    }));
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const params = new URLSearchParams();
    params.set("variable", state.variable);
    params.set("period", state.period);
    params.set("scenario", state.scenario);

    if (state.selectedDistrictId) {
      params.set("district", state.selectedDistrictId);
    }

    if (state.showChange && state.period !== "baseline") {
      params.set("change", "1");
    }

    const nextUrl = `${window.location.pathname}?${params.toString()}${window.location.hash}`;
    window.history.replaceState({}, "", nextUrl);
  }, [state]);

  return {
    ...state,
    setVariable,
    setPeriod,
    setScenario,
    selectDistrict,
    toggleShowChange,
  };
};

export type MapControlsReturn = ReturnType<typeof useMapControls>;
