import { useState } from "react";
import ClimateChart from "../Charts/ClimateChart";
import StatisticsTable from "./StatisticsTable";
import DownloadsSection from "./DownloadsSection";
import { useDistrictTimeSeries } from "../../hooks/useDistrictTimeSeries";
import type { ClimateVariable, ClimateComparison, Scenario, Period } from "../../types/climate";
import { formatValue } from "../../utils/colorScales";
import {
  getScenarioPanelLabel,
  getPeriodRangeLabel,
  getVariableDisplayName,
} from "../../utils/climateLabels";

interface DistrictDetailPanelProps {
  districtId: string;
  districtName: string;
  regionName: string;
  variable: string;
  variableInfo: ClimateVariable | undefined;
  scenario: Scenario;
  period: Period;
  comparisonData: ClimateComparison | undefined;
  baselineValue: number | undefined;
  onClose: () => void;
}

const DistrictDetailPanel: React.FC<DistrictDetailPanelProps> = ({
  districtId,
  districtName,
  regionName,
  variable,
  variableInfo,
  scenario,
  period,
  comparisonData,
  baselineValue,
  onClose,
}) => {
  const [showMoreDetails, setShowMoreDetails] = useState(false);
  const { data: timeSeriesData, statistics, isLoading } = useDistrictTimeSeries(
    districtId,
    variable,
    scenario,
    period
  );

  const unit = variableInfo?.unit || "";
  const variableName = getVariableDisplayName(variable, variableInfo?.name);
  const scenarioLabel = getScenarioPanelLabel(scenario);
  const selectedPeriodLabel = getPeriodRangeLabel(period);
  const baselineDisplayValue = period === "baseline" ? baselineValue : comparisonData?.baseline;
  const futureValue = comparisonData?.future;
  const change = comparisonData?.change;
  const hasComparison = period !== "baseline" && futureValue !== undefined;
  const isPrecipitationVariable = variableInfo?.category === "precipitation";
  const hasPositiveSemanticChange =
    change !== undefined && (isPrecipitationVariable ? change >= 0 : change < 0);
  const changeSemanticClass = hasPositiveSemanticChange ? "is-positive" : "is-negative";

  return (
    <div className="district-detail-panel">
      <button className="panel-close-btn" onClick={onClose} aria-label="Close panel">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>

      <div className="district-header-orange">
        <div className="header-region">{regionName}</div>
        <h2 className="header-district-name">{districtName}</h2>
        <div className="header-subtitle">Projected change in mean</div>
        <h3 className="header-variable-name">{variableName}</h3>
        <div className="header-scenario">{scenarioLabel}</div>

        <div className="header-period-comparison">
          {hasComparison ? (
            <>
              <div className="period-range">
                <span className="period-baseline">{getPeriodRangeLabel("baseline")}</span>
                <span className="period-future">{selectedPeriodLabel}</span>
              </div>

              <div className="value-display">
                <span className="value-baseline">
                  {baselineDisplayValue !== undefined ? formatValue(baselineDisplayValue, unit) : "-"}
                </span>
                <span className="value-arrow" aria-hidden="true">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 12h14" />
                    <path d="m13 6 6 6-6 6" />
                  </svg>
                </span>
                <span className="value-future">
                  {futureValue !== undefined ? formatValue(futureValue, unit) : "-"}
                </span>
              </div>

              {change !== undefined && (
                <div className={`change-indicator ${changeSemanticClass}`}>
                  <span className="change-direction">{change >= 0 ? "Up" : "Down"}</span>
                  <span className="change-triangle" aria-hidden="true">
                    {change >= 0 ? "▲" : "▼"}
                  </span>
                  <span className="change-value">
                    {change >= 0 ? "+" : ""}
                    {change.toFixed(1)}
                    {unit}
                  </span>
                </div>
              )}
            </>
          ) : (
            <div className="baseline-only-display">
              <span className="period-baseline">{getPeriodRangeLabel("baseline")}</span>
              <span className="value-baseline">
                {baselineDisplayValue !== undefined ? formatValue(baselineDisplayValue, unit) : "-"}
              </span>
            </div>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="chart-loading">
          <div className="spinner-small" />
          <span>Loading chart data...</span>
        </div>
      ) : (
        <ClimateChart
          data={timeSeriesData}
          unit={unit}
          variableId={variable}
          variableName={variableName}
          selectedPeriod={period}
        />
      )}

      <div className="more-details-section">
        <button
          className="more-details-header"
          onClick={() => setShowMoreDetails(!showMoreDetails)}
        >
          <span>More Details</span>
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              transform: showMoreDetails ? "rotate(180deg)" : "rotate(0deg)",
              transition: "transform 0.2s",
            }}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>

        {showMoreDetails && statistics && (
          <div className="more-details-content">
            <StatisticsTable
              statistics={statistics}
              unit={unit}
              futurePeriodLabel={selectedPeriodLabel}
            />

            <div className="explore-link">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="9 18 15 12 9 6" />
              </svg>
              <span>Explore detailed climate data</span>
            </div>
          </div>
        )}
      </div>

      <DownloadsSection
        districtName={districtName}
        regionName={regionName}
        variableName={variableName}
        unit={unit}
        scenario={scenario}
        data={timeSeriesData}
      />

      <div className="panel-footer">
        <div className="data-source">
          Data source: GhKAPy regional climate projections downscaled for Ghana.
        </div>
      </div>
    </div>
  );
};

export default DistrictDetailPanel;
