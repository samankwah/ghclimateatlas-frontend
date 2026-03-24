// Horizontal timeline bar for period and scenario selection

import type { Period, Scenario } from "../../types/climate";
import { getScenarioOptions, isSeaLevelVariableId } from "../../utils/climateLabels";

interface TimelineBarProps {
  selectedPeriod: Period;
  onPeriodChange: (period: Period) => void;
  variableId?: string;
  scenario?: Scenario;
  onScenarioChange?: (scenario: Scenario) => void;
}

const PERIODS: { id: Period; label: string }[] = [
  { id: "baseline", label: "REFERENCE" },
  { id: "2030", label: "2021-2040" },
  { id: "2050", label: "2041-2060" },
  { id: "2080", label: "2081-2100" },
];

const getScenarioDisplayText = (scenarioId: Scenario, isSeaLevel: boolean): string => {
  if (isSeaLevel) {
    return scenarioId.toUpperCase();
  }
  if (scenarioId === "rcp26") return "Low (RCP2.6)";
  if (scenarioId === "rcp45") return "Mid (RCP4.5)";
  return "High (RCP8.5)";
};

const TimelineBar: React.FC<TimelineBarProps> = ({
  selectedPeriod,
  onPeriodChange,
  variableId,
  scenario = "rcp45",
  onScenarioChange,
}) => {
  const scenarioOptions = getScenarioOptions(variableId);
  const scenarioValue = Math.max(0, scenarioOptions.indexOf(scenario));
  const isSeaLevel = isSeaLevelVariableId(variableId);

  const handleScenarioSlider = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onScenarioChange) {
      const nextScenario = scenarioOptions[Number(e.target.value)] ?? scenarioOptions[1] ?? scenarioOptions[0];
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
          EMISSION SCENARIO
          <span
            className="info-icon"
            title={
              isSeaLevel
                ? "Sea-level scenarios shown using the dataset's scientific SSP labels."
                : "Climate change scenario - Lowest (RCP2.6), Less (RCP4.5), or More (RCP8.5) emissions"
            }
          >
            i
          </span>
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
            {scenarioOptions.map((option) => (
              <span key={option} className={scenario === option ? "active" : ""}>
                {getScenarioDisplayText(option, isSeaLevel)}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Time Period Slider Section */}
      <div className="timeline-section" data-tour="time-period">
        <span className="section-label">
          TIME PERIOD
          <span
            className="info-icon"
            title="Select time period for climate projections"
          >
            i
          </span>
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
