import { useMemo } from "react";
import type { ClimateVariable, Period, Scenario } from "../../types/climate";
import type { ColorScaleType } from "../../utils/colorScales";
import { generateLegendStops, normalizeUnit } from "../../utils/colorScales";
import mobileLogo from "../../assets/smart logo GMet.png";
import {
  getPeriodRangeLabel,
  getScenarioDescription,
  getScenarioLabel,
} from "../../utils/climateLabels";
import { isSeaLevelVariable } from "../../utils/coastalExposure";

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
  mobileActionsOpen: boolean;
  onToggleMobileActions: () => void;
  onOpenHelp: () => void;
  onOpenTour: () => void;
  onShare: () => void;
}

const SEA_LEVEL_HEADER_TITLES: Record<string, string> = {
  sea_level_rise: "Sea Level Rise",
  storm_surge_flood_risk: "Storm Surge Flood Risk",
  coastal_erosion_risk: "Coastal Erosion Risk",
  saltwater_intrusion_risk: "Saltwater Intrusion Risk",
};

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
  mobileActionsOpen,
  onToggleMobileActions,
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

  const displayUnit = normalizeUnit(variable?.unit || "\u00B0C");
  const rawHeaderTitle = parameterLabel || variable?.name || "Climate Variable";
  const conciseHeaderTitle =
    variable?.id && isSeaLevelVariable(variable.id)
      ? SEA_LEVEL_HEADER_TITLES[variable.id] || rawHeaderTitle
      : rawHeaderTitle;
  const headerTitle = conciseHeaderTitle;
  const mobileHeaderTitle = conciseHeaderTitle;
  const scenarioSummary =
    period !== "baseline"
      ? `${getScenarioLabel(scenario)} -> ${getScenarioDescription(scenario)} | ${getPeriodRangeLabel(period)}`
      : `Baseline: ${getPeriodRangeLabel("baseline")}`;

  return (
    <header className="new-header">
      <div className={`mobile-header-shell ${mobileActionsOpen ? "is-open" : ""}`}>
        <div className="mobile-header-row">
          <img className="mobile-header-logo" src={mobileLogo} alt="GMet" />

          <div className="mobile-header-center">
            <div className={`mobile-header-title-group ${mobileActionsOpen ? "is-hidden" : ""}`}>
              <h1 className="mobile-header-title">{mobileHeaderTitle}</h1>
              <span className="mobile-header-scenario">{scenarioSummary}</span>
            </div>
            <div
              id="mobile-header-actions"
              className={`mobile-header-actions ${mobileActionsOpen ? "is-open" : ""}`}
            >
              <button
                type="button"
                className="mobile-header-action"
                title="Help"
                onClick={onOpenHelp}
                data-tour="map-information"
              >
                <span>HELP</span>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              </button>
              <button type="button" className="mobile-header-action" title="Guide" onClick={onOpenTour}>
                <span>GUIDE</span>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <polygon points="10 8 16 12 10 16 10 8" />
                </svg>
              </button>
              <button
                type="button"
                className="mobile-header-action mobile-header-action-share"
                title="Share"
                data-tour="share-map"
                onClick={onShare}
              >
                <span>SHARE</span>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="18" cy="5" r="3" />
                  <circle cx="6" cy="12" r="3" />
                  <circle cx="18" cy="19" r="3" />
                  <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                  <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                </svg>
              </button>
            </div>
          </div>

          <button
            type="button"
            className="mobile-header-toggle"
            onClick={onToggleMobileActions}
            aria-expanded={mobileActionsOpen}
            aria-controls="mobile-header-actions"
            aria-label={mobileActionsOpen ? "Collapse mobile actions" : "Expand mobile actions"}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 6 9 12 15 18" />
              <polyline points="21 6 15 12 21 18" />
            </svg>
          </button>
        </div>

        {shareStatus ? <div className="mobile-share-status">{shareStatus}</div> : null}
      </div>

      <div className="header-content">
        <div className="header-left">
          <div className="map-label">
            <img className="desktop-header-logo" src={mobileLogo} alt="GMet" />
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
          <h1 className="variable-title">{headerTitle}</h1>
          <div className="scenario-info" data-tour="scenarios">
            {period !== "baseline" ? (
              <>
                <span className="scenario-text">
                  {getScenarioLabel(scenario)} {"->"} {getScenarioDescription(scenario)}
                </span>
                <span className="period-separator">|</span>
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
