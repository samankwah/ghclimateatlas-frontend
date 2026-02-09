// Climate variable selector dropdown

import type { ClimateVariable } from "../../types/climate";

interface VariableSelectorProps {
  variables: ClimateVariable[] | undefined;
  selectedVariable: string;
  onVariableChange: (variableId: string) => void;
}

const VariableSelector: React.FC<VariableSelectorProps> = ({
  variables,
  selectedVariable,
  onVariableChange,
}) => {
  if (!variables) {
    return <div className="control-loading">Loading variables...</div>;
  }

  // Group variables by category
  const temperatureVars = variables.filter((v) => v.category === "temperature");
  const precipitationVars = variables.filter((v) => v.category === "precipitation");

  return (
    <div className="variable-selector">
      <label htmlFor="variable-select">Climate Variable</label>
      <select
        id="variable-select"
        value={selectedVariable}
        onChange={(e) => onVariableChange(e.target.value)}
      >
        <optgroup label="Temperature">
          {temperatureVars.map((v) => (
            <option key={v.id} value={v.id}>
              {v.name}
            </option>
          ))}
        </optgroup>
        <optgroup label="Precipitation">
          {precipitationVars.map((v) => (
            <option key={v.id} value={v.id}>
              {v.name}
            </option>
          ))}
        </optgroup>
      </select>

      {/* Show description of selected variable */}
      {variables.find((v) => v.id === selectedVariable) && (
        <p className="variable-description">
          {variables.find((v) => v.id === selectedVariable)?.description}
        </p>
      )}
    </div>
  );
};

export default VariableSelector;
