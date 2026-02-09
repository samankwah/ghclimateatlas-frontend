// District Detail Panel - Full-featured sliding panel for district climate info

import { useState } from "react";
import ClimateChart from "../Charts/ClimateChart";
import StatisticsTable from "./StatisticsTable";
import DownloadsSection from "./DownloadsSection";
import { useDistrictTimeSeries } from "../../hooks/useDistrictTimeSeries";
import type { ClimateVariable, ClimateComparison, Scenario, Period } from "../../types/climate";
import { formatValue } from "../../utils/colorScales";

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

  // Fetch time series data for the chart
  const { data: timeSeriesData, statistics, isLoading } = useDistrictTimeSeries(
    districtId,
    variable,
    scenario
  );

  const unit = variableInfo?.unit || "";
  const variableName = variableInfo?.name || "Climate Variable";
  const scenarioLabel = scenario === "rcp45" ? "Low Carbon" : "High Carbon";

  // Get period labels matching the target design
  const getPeriodLabel = (p: Period): string => {
    switch (p) {
      case "baseline":
        return "1976-2005";
      case "2030":
        return "2021-2050";
      case "2050":
        return "2041-2070";
      case "2080":
        return "2051-2080";
      default:
        return p;
    }
  };

  // Calculate values for display
  const baselineDisplayValue = period === "baseline" ? baselineValue : comparisonData?.baseline;
  const futureValue = comparisonData?.future;
  const change = comparisonData?.change;

  return (
    <div className="district-detail-panel">
      {/* Close button */}
      <button className="panel-close-btn" onClick={onClose} aria-label="Close panel">
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>

      {/* Orange header section matching target design */}
      <div className="district-header-orange">
        <div className="header-region">{regionName}</div>
        <h2 className="header-district-name">{districtName}</h2>
        <div className="header-subtitle">Projected change in mean</div>
        <h3 className="header-variable-name">{variableName}</h3>
        <div className="header-scenario">
          {scenarioLabel} → {scenario === "rcp45" ? "Less climate change" : "More climate change"}
        </div>

        {/* Period comparison with large values */}
        <div className="header-period-comparison">
          <div className="period-range">
            <span className="period-baseline">1976-2005</span>
            <span className="period-future">2051-2080</span>
          </div>

          <div className="value-display">
            <span className="value-baseline">
              {baselineDisplayValue !== undefined ? formatValue(baselineDisplayValue, unit) : "-"}
            </span>
            <span className="value-arrow">→</span>
            <span className="value-future">
              {futureValue !== undefined ? formatValue(futureValue, unit) : "-"}
            </span>
          </div>

          {change !== undefined && (
            <div className={`change-indicator ${change < 0 ? "decrease" : ""}`}>
              <span className="change-direction">{change >= 0 ? "Up" : "Down"}</span>
              <span className="change-triangle">{change >= 0 ? "△" : "▽"}</span>
              <span className={`change-value ${change >= 0 ? "increase" : "decrease"}`}>
                {change >= 0 ? "+" : ""}{change.toFixed(1)}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Time series chart */}
      {isLoading ? (
        <div className="chart-loading">
          <div className="spinner-small" />
          <span>Loading chart data...</span>
        </div>
      ) : (
        <ClimateChart
          data={timeSeriesData}
          unit={unit}
          variableName={variableName}
          futurePeriodLabel="2051-2080"
        />
      )}

      {/* More Details section (collapsible) */}
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
              futurePeriodLabel={getPeriodLabel("2080")}
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

      {/* Downloads section */}
      <DownloadsSection
        districtName={districtName}
        regionName={regionName}
        variableName={variableName}
        unit={unit}
        scenario={scenario}
        data={timeSeriesData}
      />

      {/* Data source footer */}
      <div className="panel-footer">
        <div className="data-source">Data: CORDEX-Africa</div>
      </div>
    </div>
  );
};

export default DistrictDetailPanel;
