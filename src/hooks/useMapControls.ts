// Map controls state management

import { useState, useCallback } from "react";
import type { Period, Scenario, MapState } from "../types/climate";

const DEFAULT_STATE: MapState = {
  variable: "annual_max_temp",
  period: "baseline",
  scenario: "rcp45",
  selectedDistrictId: null,
  showChange: false,
};

export const useMapControls = () => {
  const [state, setState] = useState<MapState>(DEFAULT_STATE);

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
