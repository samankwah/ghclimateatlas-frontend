// District info panel component

import type { ClimateComparison, ClimateValue, ClimateVariable } from "../../types/climate";
import { formatValue, formatChange } from "../../utils/colorScales";

interface DistrictInfoProps {
  districtId: string | null;
  climateData: ClimateValue[] | undefined;
  comparisonData: ClimateComparison[] | undefined;
  variableInfo: ClimateVariable | undefined;
  period: string;
  scenario: string;
  onClose: () => void;
}

const DistrictInfo: React.FC<DistrictInfoProps> = ({
  districtId,
  climateData,
  comparisonData,
  variableInfo,
  period,
  scenario,
  onClose,
}) => {
  if (!districtId) {
    return (
      <div className="district-info empty">
        <p>Click on a district to see climate details</p>
      </div>
    );
  }

  // Find district data
  const climateValue = climateData?.find((d) => d.district_id === districtId);
  const comparison = comparisonData?.find((d) => d.district_id === districtId);

  if (!climateValue) {
    return (
      <div className="district-info loading">
        <p>Loading district data...</p>
      </div>
    );
  }

  const unit = variableInfo?.unit || "";
  const variableName = variableInfo?.name || "Value";

  return (
    <div className="district-info">
      <button className="close-btn" onClick={onClose} aria-label="Close">
        &times;
      </button>

      <h3 className="district-name">{climateValue.district_name}</h3>

      <div className="info-section">
        <h4>{variableName}</h4>

        {period === "baseline" ? (
          <div className="value-display">
            <span className="label">Baseline (1991-2020)</span>
            <span className="value">{formatValue(climateValue.value, unit)}</span>
          </div>
        ) : (
          <>
            {comparison && (
              <>
                <div className="value-display">
                  <span className="label">Baseline</span>
                  <span className="value">{formatValue(comparison.baseline, unit)}</span>
                </div>

                <div className="value-display future">
                  <span className="label">
                    {period === "2030" && "2030s"}
                    {period === "2050" && "2050s"}
                    {period === "2080" && "2080s"}
                    {" "}({scenario.toUpperCase()})
                  </span>
                  <span className="value">{formatValue(comparison.future, unit)}</span>
                </div>

                <div className={`change-display ${comparison.change >= 0 ? "increase" : "decrease"}`}>
                  <span className="label">Change</span>
                  <span className="change-value">
                    {formatChange(comparison.change, unit)}
                    <span className="percent">({comparison.change_percent >= 0 ? "+" : ""}{comparison.change_percent.toFixed(1)}%)</span>
                  </span>
                </div>

                {/* Visual change indicator */}
                <div className="change-bar">
                  <div
                    className={`change-fill ${comparison.change >= 0 ? "increase" : "decrease"}`}
                    style={{
                      width: `${Math.min(Math.abs(comparison.change_percent), 100)}%`,
                    }}
                  />
                </div>
              </>
            )}
          </>
        )}
      </div>

      <div className="info-footer">
        <small>
          Data: CORDEX-Africa / KAPy Framework
        </small>
      </div>
    </div>
  );
};

export default DistrictInfo;
