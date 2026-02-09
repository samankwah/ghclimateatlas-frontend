// Header component - displays variable name, scenario badge, period info, and legend

import { useMemo } from "react";
import type { ClimateVariable, Period, Scenario } from "../../types/climate";
import type { ColorScaleType } from "../../utils/colorScales";
import { generateLegendStops } from "../../utils/colorScales";

interface HeaderProps {
  variable: ClimateVariable | undefined;
  period: Period;
  scenario: Scenario;
  // Legend props
  minValue: number;
  maxValue: number;
  colorScaleType: ColorScaleType;
  showChange: boolean;
  parameterLabel?: string | null;
  parameterDescription?: string | null;
}

const Header: React.FC<HeaderProps> = ({
  variable,
  period,
  scenario,
  minValue,
  maxValue,
  colorScaleType,
  showChange,
  parameterLabel,
  parameterDescription,
}) => {
  const getPeriodLabel = (p: Period): string => {
    switch (p) {
      case "baseline":
        return "1991-2020";
      case "2030":
        return "2021-2050";
      case "2050":
        return "2041-2060";
      case "2080":
        return "2051-2080";
      default:
        return p;
    }
  };

  const getScenarioText = (s: Scenario): string => {
    return s === "rcp85" ? "High Carbon → More climate change" : "Low Carbon → Less climate change";
  };

  // Generate legend gradient
  const gradientStyle = useMemo(() => {
    const stops = generateLegendStops(
      minValue,
      maxValue,
      showChange ? "diverging" : colorScaleType,
      5
    );
    const colors = stops.map((s) => s.color).join(", ");
    return {
      background: `linear-gradient(to right, ${colors})`,
    };
  }, [minValue, maxValue, colorScaleType, showChange]);

  return (
    <header className="new-header">
      <div className="header-content">
        {/* Left: MAP label + Legend */}
        <div className="header-left">
          <div className="map-label">
            <span className="map-text">MAP</span>
            <span className="info-icon-orange">i</span>
          </div>
          <div className="header-legend">
            <span className="legend-label">
              {showChange ? "Change" : "Average value"} ({variable?.unit || "°C"})
            </span>
            <div className="legend-bar-container">
              <span className="legend-value">{minValue.toFixed(0)}</span>
              <div className="legend-gradient" style={gradientStyle} />
              <span className="legend-value">{maxValue.toFixed(0)}</span>
            </div>
          </div>
        </div>

        {/* Center: Variable name + scenario info */}
        <div className="header-center">
          <h1 className="variable-title">{parameterLabel || variable?.name || "Climate Variable"}</h1>
          {parameterDescription && (
            <span className="variable-description">{parameterDescription}</span>
          )}
          <div className="scenario-info">
            {period !== "baseline" ? (
              <>
                <span className="scenario-text">{getScenarioText(scenario)}</span>
                <span className="period-separator">•</span>
                <span className="period-text">{getPeriodLabel(period)}</span>
              </>
            ) : (
              <span className="period-text">Baseline: 1991-2020</span>
            )}
          </div>
        </div>

        {/* Right: Action buttons */}
        <div className="header-right">
          <button className="header-btn-labeled" title="Help">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            <span>HELP</span>
          </button>
          <button className="header-btn-labeled" title="Tour">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <polygon points="10 8 16 12 10 16 10 8" />
            </svg>
            <span>TOUR</span>
          </button>
          <button className="header-btn-labeled" title="Share">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="18" cy="5" r="3" />
              <circle cx="6" cy="12" r="3" />
              <circle cx="18" cy="19" r="3" />
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
              <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
            </svg>
            <span>SHARE</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
