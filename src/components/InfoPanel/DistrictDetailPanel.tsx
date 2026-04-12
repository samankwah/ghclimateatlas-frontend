import { useState } from "react";
import ClimateChart from "../Charts/ClimateChart";
import StatisticsTable from "./StatisticsTable";
import DownloadsSection from "./DownloadsSection";
import WeatherLoader from "../WeatherLoader";
import { useDistrictTimeSeries } from "../../hooks/useDistrictTimeSeries";
import { useDistrictChartSeries } from "../../hooks/useDistrictChartSeries";
import type { ClimateVariable, ClimateComparison, Scenario, Period } from "../../types/climate";
import { formatValue, normalizeUnit } from "../../utils/colorScales";
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
  showChange?: boolean;
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
  showChange = false,
  onClose,
}) => {
  const [showMoreDetails, setShowMoreDetails] = useState(false);
  const { data: timeSeriesData, statistics, isLoading } = useDistrictTimeSeries(
    districtId,
    variable,
    scenario,
    period
  );
  const {
    series: chartSeries,
    isLoading: isChartLoading,
  } = useDistrictChartSeries(districtId, variable, scenario);

  const unit = variableInfo?.unit || "";
  const normalizedUnit = normalizeUnit(unit);
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

  const renderValueBlock = (value: number | undefined, tone: "baseline" | "future") => {
    if (value === undefined) {
      return <span className={`value-${tone}`}>-</span>;
    }

    if (normalizedUnit === "mm") {
      return (
        <span className={`value-${tone} value-with-unit`}>
          <span className="value-number">{Math.round(value).toLocaleString()}</span>
          <span className="value-unit">mm</span>
        </span>
      );
    }

    return <span className={`value-${tone}`}>{formatValue(value, unit)}</span>;
  };

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
                {renderValueBlock(baselineDisplayValue, "baseline")}
                <span className="value-arrow" aria-hidden="true">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 12h14" />
                    <path d="m13 6 6 6-6 6" />
                  </svg>
                </span>
                {renderValueBlock(futureValue, "future")}
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
              {renderValueBlock(baselineDisplayValue, "baseline")}
            </div>
          )}
        </div>
      </div>

      {isLoading || isChartLoading ? (
        <div className="chart-loading">
          <WeatherLoader size="sm" />
          <span>Loading chart data...</span>
        </div>
      ) : (
        <ClimateChart
          series={chartSeries}
          variableName={variableName}
          scenario={scenario}
          selectedPeriod={period}
          showChange={showChange}
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
