// Statistics table showing Low/Med/High values for baseline and future periods

import type { DistrictStatistics } from "../../hooks/useDistrictTimeSeries";
import { formatValue } from "../../utils/colorScales";

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
  return (
    <div className="statistics-section">
      <div className="statistics-table-scroll">
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
              <td>{formatValue(statistics.baseline.low, unit)}</td>
              <td>{formatValue(statistics.baseline.median, unit)}</td>
              <td>{formatValue(statistics.baseline.high, unit)}</td>
            </tr>
            <tr>
              <td className="period-cell">{futurePeriodLabel}</td>
              <td>{formatValue(statistics.future.low, unit)}</td>
              <td>{formatValue(statistics.future.median, unit)}</td>
              <td>{formatValue(statistics.future.high, unit)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="grid-point-info">
        This district contains approximately {statistics.gridPointCount} climate
        modeled grid points.
      </div>
    </div>
  );
};

export default StatisticsTable;
