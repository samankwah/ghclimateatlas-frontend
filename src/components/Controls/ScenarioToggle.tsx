// Emission scenario toggle component

import type { Scenario } from "../../types/climate";

interface ScenarioToggleProps {
  selectedScenario: Scenario;
  onScenarioChange: (scenario: Scenario) => void;
  disabled?: boolean;
}

const SCENARIOS: { value: Scenario; label: string; description: string }[] = [
  {
    value: "rcp45",
    label: "RCP 4.5",
    description: "Moderate emissions - Less climate change",
  },
  {
    value: "rcp85",
    label: "RCP 8.5",
    description: "High emissions - More climate change",
  },
];

const ScenarioToggle: React.FC<ScenarioToggleProps> = ({
  selectedScenario,
  onScenarioChange,
  disabled = false,
}) => {
  return (
    <div className={`scenario-toggle ${disabled ? "disabled" : ""}`}>
      <label>Emission Scenario</label>

      <div className="toggle-container">
        <span className="toggle-label left">Less</span>

        <div className="toggle-buttons">
          {SCENARIOS.map((scenario) => (
            <button
              key={scenario.value}
              className={`toggle-btn ${selectedScenario === scenario.value ? "active" : ""}`}
              onClick={() => !disabled && onScenarioChange(scenario.value)}
              disabled={disabled}
              title={scenario.description}
            >
              {scenario.label}
            </button>
          ))}
        </div>

        <span className="toggle-label right">More</span>
      </div>

      {disabled && (
        <p className="toggle-hint">
          Scenario selection available for future periods
        </p>
      )}
    </div>
  );
};

export default ScenarioToggle;
