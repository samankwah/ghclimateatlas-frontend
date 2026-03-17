// Horizontal timeline bar for period and scenario selection

import type { Period, Scenario } from "../../types/climate";

interface TimelineBarProps {
  selectedPeriod: Period;
  onPeriodChange: (period: Period) => void;
  scenario?: Scenario;
  onScenarioChange?: (scenario: Scenario) => void;
}

const PERIODS: { id: Period; label: string }[] = [
  { id: "baseline", label: "RECENT PAST" },
  { id: "2030", label: "2021-2050" },
  { id: "2050", label: "2041-2070" },
  { id: "2080", label: "2051-2080" },
];

const TimelineBar: React.FC<TimelineBarProps> = ({
  selectedPeriod,
  onPeriodChange,
  scenario = "rcp45",
  onScenarioChange,
}) => {
  const scenarioValue = scenario === "rcp45" ? 0 : scenario === "rcp60" ? 1 : 2;

  const handleScenarioSlider = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onScenarioChange) {
      const nextScenario = e.target.value === "0"
        ? "rcp45"
        : e.target.value === "1"
          ? "rcp60"
          : "rcp85";
      onScenarioChange(nextScenario);
    }
  };

  const currentPeriodIndex = PERIODS.findIndex((p) => p.id === selectedPeriod);

  const handlePeriodSlider = (e: React.ChangeEvent<HTMLInputElement>) => {
    const index = parseInt(e.target.value, 10);
    onPeriodChange(PERIODS[index].id);
  };

  return (
    <div className="timeline-bar" data-tour="scenarios">
      {/* Climate Change Slider Section */}
      <div className="timeline-section" data-tour="climate-change">
        <span className="section-label">
          CLIMATE CHANGE
          <span className="info-icon" title="Climate change scenario - Less (RCP4.5), Medium (RCP6.0), or More (RCP8.5) emissions">i</span>
        </span>
        <div className="scenario-slider">
          <input
            type="range"
            min="0"
            max="2"
            step="1"
            value={scenarioValue}
            onChange={handleScenarioSlider}
          />
          <div className="scenario-labels climate-change-labels">
            <span className={scenario === "rcp45" ? "active" : ""}>LESS</span>
            <span className={scenario === "rcp60" ? "active" : ""}>MEDIUM</span>
            <span className={scenario === "rcp85" ? "active" : ""}>MORE</span>
          </div>
        </div>
      </div>

      {/* Time Period Slider Section */}
      <div className="timeline-section" data-tour="time-period">
        <span className="section-label">
          TIME PERIOD
          <span className="info-icon" title="Select time period for climate projections">i</span>
        </span>
        <div className="scenario-slider time-period-slider">
          <input
            type="range"
            min="0"
            max={PERIODS.length - 1}
            step="1"
            value={currentPeriodIndex}
            onChange={handlePeriodSlider}
          />
          <div className="scenario-labels period-labels">
            {PERIODS.map((period, index) => (
              <span
                key={period.id}
                className={index === currentPeriodIndex ? "active" : ""}
                style={{ cursor: "pointer" }}
                onClick={() => onPeriodChange(period.id)}
              >
                {period.label}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TimelineBar;
