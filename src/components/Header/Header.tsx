import { useState, useRef, useCallback } from "react";
import type { ClimateVariable, Period, Scenario } from "../../types/climate";
import type { ColorScaleType } from "../../utils/colorScales";
import Legend from "../Map/Legend";
import mobileLogo from "../../assets/smart-logo-gmet.webp";
import { isSeaLevelVariable } from "../../utils/coastalExposure";
import ShareDropdown from "./ShareDropdown";

interface HeaderProps {
  variable: ClimateVariable | undefined;
  period: Period;
  scenario: Scenario;
  minValue: number;
  maxValue: number;
  colorScaleType: ColorScaleType;
  showChange: boolean;
  parameterLabel?: string | null;
  mobileActionsOpen: boolean;
  onToggleMobileActions: () => void;
  onOpenHelp: () => void;
  onOpenTour: () => void;
  onCloseMobileActions: () => void;
}

const SEA_LEVEL_HEADER_TITLES: Record<string, string> = {
  sea_level_rise: "Sea Level Rise",
  storm_surge_flood_risk: "Storm Surge Flood Risk",
  coastal_erosion_risk: "Coastal Erosion Risk",
  saltwater_intrusion_risk: "Saltwater Intrusion Risk",
};

const SCENARIO_CODES: Record<Scenario, string> = {
  rcp26: "RCP2.6",
  rcp45: "RCP4.5",
  rcp85: "RCP8.5",
};

const PERIOD_SUMMARY_LABELS: Record<Period, string> = {
  baseline: "Reference (1991-2020)",
  "2030": "Near Term (2021-2040)",
  "2050": "Mid-Century (2041-2060)",
  "2080": "End-Century (2081-2100)",
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
  mobileActionsOpen,
  onToggleMobileActions,
  onOpenHelp,
  onOpenTour,
}) => {
  const [shareOpen, setShareOpen] = useState(false);
  const shareButtonRef = useRef<HTMLButtonElement>(null);
  const mobileShareButtonRef = useRef<HTMLButtonElement>(null);

  const handleShareClick = useCallback(() => {
    setShareOpen((prev) => !prev);
  }, []);

  const handleShareClose = useCallback(() => {
    setShareOpen(false);
  }, []);

  const handleMobileShareClick = useCallback(() => {
    setShareOpen((prev) => !prev);
  }, []);
  const rawHeaderTitle = parameterLabel || variable?.name || "Climate Variable";
  const conciseHeaderTitle =
    variable?.id && isSeaLevelVariable(variable.id)
      ? SEA_LEVEL_HEADER_TITLES[variable.id] || rawHeaderTitle
      : rawHeaderTitle;
  const headerTitle = conciseHeaderTitle;
  const mobileHeaderTitle = conciseHeaderTitle;
  const scenarioSummary =
    period !== "baseline"
      ? `${SCENARIO_CODES[scenario]} | ${PERIOD_SUMMARY_LABELS[period]}`
      : PERIOD_SUMMARY_LABELS.baseline;
  const desktopScenarioLabel =
    period !== "baseline"
      ? `${SCENARIO_CODES[scenario]} | ${PERIOD_SUMMARY_LABELS[period]}`
      : PERIOD_SUMMARY_LABELS.baseline;

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
              <div className="share-button-wrapper">
                <button
                  type="button"
                  className="mobile-header-action mobile-header-action-share"
                  title="Share"
                  ref={mobileShareButtonRef}
                  onClick={handleMobileShareClick}
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
                <ShareDropdown
                  isOpen={shareOpen}
                  onClose={handleShareClose}
                  anchorRef={mobileShareButtonRef}
                />
              </div>
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
      </div>

      <div className="header-content">
        <div className="header-left">
          <div className="map-label">
            <img className="desktop-header-logo" src={mobileLogo} alt="GMet" />
          </div>
          <Legend
            variable={variable}
            minValue={minValue}
            maxValue={maxValue}
            colorScaleType={colorScaleType}
            showChange={showChange}
            className="header-legend"
          />
        </div>

        <div className="header-center" data-tour="map-information">
          <h1 className="variable-title">{headerTitle}</h1>
          <div className="scenario-info">
            <span className="period-text">{desktopScenarioLabel}</span>
          </div>
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
          <div className="share-button-wrapper">
            <button className="header-btn-labeled" title="Share" data-tour="share-map" ref={shareButtonRef} onClick={handleShareClick}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="18" cy="5" r="3" />
                <circle cx="6" cy="12" r="3" />
                <circle cx="18" cy="19" r="3" />
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
              </svg>
              <span>SHARE</span>
            </button>
            <ShareDropdown
              isOpen={shareOpen}
              onClose={handleShareClose}
              anchorRef={shareButtonRef}
            />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
