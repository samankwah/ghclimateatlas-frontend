// Downloads section with PDF and CSV export options

import { exportToCSV, exportToPDF, exportAll } from "../../utils/exportData";
import type { TimeSeriesPoint } from "../../hooks/useDistrictTimeSeries";

interface DownloadsSectionProps {
  districtName: string;
  regionName: string;
  variableName: string;
  unit: string;
  scenario: string;
  data: TimeSeriesPoint[];
}

const DownloadsSection: React.FC<DownloadsSectionProps> = ({
  districtName,
  regionName,
  variableName,
  unit,
  scenario,
  data,
}) => {
  const exportOptions = {
    districtName,
    regionName,
    variableName,
    unit,
    scenario,
    data,
  };

  const handleExportPDF = () => {
    exportToPDF(exportOptions);
  };

  const handleExportCSV = () => {
    exportToCSV(exportOptions);
  };

  const handleExportAll = () => {
    exportAll(exportOptions);
  };

  return (
    <div className="downloads-section">
      <div className="downloads-header">Downloads</div>

      <button className="download-item" onClick={handleExportPDF}>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
          <polyline points="10 9 9 9 8 9" />
        </svg>
        <span>Climate report - PDF</span>
      </button>

      <button className="download-item" onClick={handleExportCSV}>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
          <line x1="3" y1="9" x2="21" y2="9" />
          <line x1="3" y1="15" x2="21" y2="15" />
          <line x1="9" y1="3" x2="9" y2="21" />
          <line x1="15" y1="3" x2="15" y2="21" />
        </svg>
        <span>Climate model data - CSV</span>
      </button>

      <button className="download-item" onClick={handleExportAll}>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
        <span>Download all - CSV</span>
      </button>
    </div>
  );
};

export default DownloadsSection;
