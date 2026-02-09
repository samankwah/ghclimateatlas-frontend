// Statistics table showing Low/Med/High values for baseline and future periods

import type { DistrictStatistics } from "../../hooks/useDistrictTimeSeries";

interface StatisticsTableProps {
  statistics: DistrictStatistics;
  unit: string;
  futurePeriodLabel: string;
}

const StatisticsTable: React.FC<StatisticsTableProps> = ({
  statistics,
  unit,
  futurePeriodLabel,
}) => {
  const formatValue = (value: number) => {
    if (unit === "°C") return `${value.toFixed(1)}${unit}`;
    if (unit === "mm" || unit === "days") return `${Math.round(value)} ${unit}`;
    return `${value.toFixed(1)} ${unit}`;
  };

  return (
    <div className="statistics-section">
      <table className="statistics-table">
        <thead>
          <tr>
            <th className="period-header"></th>
            <th>Low</th>
            <th>Med</th>
            <th>High</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="period-cell">1991-2020</td>
            <td>{formatValue(statistics.baseline.low)}</td>
            <td>{formatValue(statistics.baseline.median)}</td>
            <td>{formatValue(statistics.baseline.high)}</td>
          </tr>
          <tr>
            <td className="period-cell">{futurePeriodLabel}</td>
            <td>{formatValue(statistics.future.low)}</td>
            <td>{formatValue(statistics.future.median)}</td>
            <td>{formatValue(statistics.future.high)}</td>
          </tr>
        </tbody>
      </table>

      <div className="grid-point-info">
        This district contains approximately {statistics.gridPointCount} climate
        modeled grid points.
      </div>
    </div>
  );
};

export default StatisticsTable;
