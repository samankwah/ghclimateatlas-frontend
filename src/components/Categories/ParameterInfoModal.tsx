// Full-screen modal for displaying detailed parameter information

import { useState, useEffect, useMemo } from "react";
import { getParameterDescription } from "./parameterDescriptions";
import { generateLegendStops } from "../../utils/colorScales";
import type { Period, Scenario } from "../../types/climate";
import { isSspScenario } from "../../utils/climateLabels";

const SCENARIO_INFO: Partial<Record<Scenario, { label: string; description: string }>> =
  {
    rcp26: {
      label: "Low Emission (RCP 2.6)",
      description:
        "A strong mitigation pathway where emissions fall quickly. This produces the least warming and the mildest long-term climate impacts among the scenarios shown in the atlas.",
    },
    rcp45: {
      label: "Moderate Emission (RCP 4.5)",
      description:
        "A moderate pathway where emissions peak around 2040 and then decline. This scenario assumes significant global efforts to reduce greenhouse gas emissions, resulting in less severe climate impacts.",
    },
    rcp85: {
      label: "High Emission (RCP 8.5)",
      description:
        "Emissions continue at current rates. This is the 'business as usual' scenario where greenhouse gas emissions continue to increase through the end of the century, resulting in more severe climate impacts.",
    },
    ssp126: {
      label: "SSP126",
      description:
        "A low-emissions shared socioeconomic pathway aligned with strong mitigation and comparatively lower sea-level rise outcomes.",
    },
    ssp245: {
      label: "SSP245",
      description:
        "A middle-of-the-road shared socioeconomic pathway representing moderate emissions and intermediate sea-level rise outcomes.",
    },
    ssp585: {
      label: "SSP585",
      description:
        "A very high-emissions shared socioeconomic pathway associated with the strongest long-term sea-level rise outcomes in this atlas.",
    },
  };

const PERIOD_INFO: Record<Period, { label: string; description: string }> = {
  baseline: {
    label: "Reference (1991-2020)",
    description:
      "The observed reference period used to compare how climate conditions have changed and will continue to change across Ghana.",
  },
  "2030": {
    label: "The Immediate Future (2021-2040)",
    description:
      "Climate change begins to take hold in the coming years. Changes are already underway and will become more noticeable within the next two decades.",
  },
  "2050": {
    label: "Mid-Century (2041-2060)",
    description:
      "A period of significant transition where the effects of climate change become clearly established across Ghana's regions.",
  },
  "2080": {
    label: "Late Century (2081-2100)",
    description:
      "The long-term outlook where the full extent of climate change impacts will be felt, varying significantly depending on the emission pathway followed.",
  },
};

interface ParameterInfoModalProps {
  parameterId: string;
  parameterLabel: string;
  categoryColor: string;
  scenario: Scenario;
  period: Period;
  onClose: () => void;
}

const CloseIcon = () => (
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
);

const ChevronIcon = ({ expanded }: { expanded: boolean }) => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    style={{
      transform: expanded ? "rotate(90deg)" : "rotate(0deg)",
      transition: "transform 0.2s ease",
    }}
  >
    <path d="M9 18l6-6-6-6" />
  </svg>
);

const GlobeIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <circle cx="12" cy="12" r="10" />
    <line x1="2" y1="12" x2="22" y2="12" />
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </svg>
);

const ParameterInfoModal: React.FC<ParameterInfoModalProps> = ({
  parameterId,
  parameterLabel,
  categoryColor,
  scenario,
  period,
  onClose,
}) => {
  const [techExpanded, setTechExpanded] = useState(false);
  const description = getParameterDescription(parameterId);

  const scenarioInfo = SCENARIO_INFO[scenario] ?? {
    label: isSspScenario(scenario) ? scenario.toUpperCase() : scenario,
    description: "",
  };
  const periodInfo = PERIOD_INFO[period] ?? { label: period, description: "" };

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  // Generate gradient using the same d3 color scale as the spatial map
  const gradientStyle = useMemo(() => {
    const stops = generateLegendStops(
      description.legendMin,
      description.legendMax,
      description.colorScaleType,
      10,
    );
    const colors = stops.map((s) => s.color).join(", ");
    return { background: `linear-gradient(to right, ${colors})` };
  }, [
    description.legendMin,
    description.legendMax,
    description.colorScaleType,
  ]);

  return (
    <div className="parameter-modal-overlay" onClick={onClose}>
      <div className="parameter-modal" onClick={(e) => e.stopPropagation()}>
        {/* Left Panel */}
        <div className="parameter-modal-left">
          <div className="modal-section">
            <h4>Emissions</h4>
            <p className="modal-highlight">{scenarioInfo.label}</p>
            <p className="modal-section-desc">{scenarioInfo.description}</p>
          </div>

          <div className="modal-section">
            <h4>Time Period</h4>
            <p className="modal-highlight">{periodInfo.label}</p>
            <p className="modal-section-desc">{periodInfo.description}</p>
          </div>

          <div className="modal-divider" />

          <div className="modal-section-parameter">
            <h3 className="modal-param-name" style={{ color: categoryColor }}>
              {parameterLabel}
            </h3>
            <p className="modal-short-desc">{description.shortDescription}</p>
          </div>
        </div>

        {/* Right Panel */}
        <div className="parameter-modal-right">
          <div className="modal-header">
            <h2>About this variable</h2>
            <button
              className="modal-close-btn"
              onClick={onClose}
              aria-label="Close modal"
            >
              <CloseIcon />
            </button>
          </div>

          <p className="modal-about-text">{description.aboutDescription}</p>

          {/* Technical Description (collapsible) */}
          <button
            className="modal-tech-toggle"
            onClick={() => setTechExpanded(!techExpanded)}
          >
            <ChevronIcon expanded={techExpanded} />
            <span>TECHNICAL DESCRIPTION</span>
          </button>

          {techExpanded && (
            <div className="modal-tech-content">
              {description.formula && (
                <p className="modal-formula">{description.formula}</p>
              )}
              <p className="modal-tech-text">
                {description.technicalDescription}
              </p>
            </div>
          )}

          {/* Legend */}
          <div className="modal-legend">
            <h4>Legend</h4>
            <p className="modal-legend-unit">{description.unit}</p>
            <div className="modal-legend-gradient" style={gradientStyle} />
            <div className="modal-legend-labels">
              <span>
                {description.legendMin} {description.unit}
              </span>
              <span>
                {description.legendMax} {description.unit}
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <button className="modal-return" onClick={onClose}>
          <GlobeIcon />
          <span>Return to the map</span>
        </button>
      </div>
    </div>
  );
};

export default ParameterInfoModal;
