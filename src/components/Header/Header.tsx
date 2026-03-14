import { useMemo } from "react";
import type { ClimateVariable, Period, Scenario } from "../../types/climate";
import type { ColorScaleType } from "../../utils/colorScales";
import { generateLegendStops, normalizeUnit } from "../../utils/colorScales";
import {
  getPeriodRangeLabel,
  getScenarioDescription,
  getScenarioLabel,
} from "../../utils/climateLabels";

interface HeaderProps {
  variable: ClimateVariable | undefined;
  period: Period;
  scenario: Scenario;
  minValue: number;
  maxValue: number;
  colorScaleType: ColorScaleType;
  showChange: boolean;
  parameterLabel?: string | null;
  shareStatus?: string | null;
  onOpenHelp: () => void;
  onOpenTour: () => void;
  onShare: () => void;
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
  shareStatus,
  onOpenHelp,
  onOpenTour,
  onShare,
}) => {
  const gradientStyle = useMemo(() => {
    const stops = generateLegendStops(
      minValue,
      maxValue,
      showChange ? "diverging" : colorScaleType,
      5
    );
    const colors = stops.map((stop) => stop.color).join(", ");
    return {
      background: `linear-gradient(to right, ${colors})`,
    };
  }, [minValue, maxValue, colorScaleType, showChange]);

  const displayUnit = normalizeUnit(variable?.unit || "°C");

  return (
    <header className="new-header">
      <div className="header-content">
        <div className="header-left">
          <div className="map-label">
            <span className="map-text">MAP</span>
            <button
              type="button"
              className="info-icon-orange"
              onClick={onOpenHelp}
              aria-label="Open help"
              data-tour="map-information"
            >
              i
            </button>
          </div>
          <div className="header-legend">
            <span className="legend-label">
              {showChange ? "Change" : "Average value"} ({displayUnit})
            </span>
            <div className="legend-bar-container">
              <span className="legend-value">{minValue.toFixed(0)}</span>
              <div className="legend-gradient" style={gradientStyle} />
              <span className="legend-value">{maxValue.toFixed(0)}</span>
            </div>
          </div>
        </div>

        <div className="header-center">
          <h1 className="variable-title">{parameterLabel || variable?.name || "Climate Variable"}</h1>
          <div className="scenario-info" data-tour="scenarios">
            {period !== "baseline" ? (
              <>
                <span className="scenario-text">
                  {getScenarioLabel(scenario)} {"->"} {getScenarioDescription(scenario)}
                </span>
                <span className="period-separator">•</span>
                <span className="period-text">{getPeriodRangeLabel(period)}</span>
              </>
            ) : (
              <span className="period-text">Baseline: {getPeriodRangeLabel("baseline")}</span>
            )}
          </div>
          {shareStatus ? <div className="share-status">{shareStatus}</div> : null}
        </div>

        <div className="header-right">
          <button className="header-btn-labeled" title="Help" onClick={onOpenHelp}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            <span>HELP</span>
          </button>
          <button className="header-btn-labeled" title="Tour" onClick={onOpenTour}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <polygon points="10 8 16 12 10 16 10 8" />
            </svg>
            <span>TOUR</span>
          </button>
          <button className="header-btn-labeled" title="Share" data-tour="share-map" onClick={onShare}>
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
