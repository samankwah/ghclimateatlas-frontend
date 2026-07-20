// Downloads section with PDF export option

import { exportToPDF } from "../../utils/exportData";
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

    </div>
  );
};

export default DownloadsSection;
