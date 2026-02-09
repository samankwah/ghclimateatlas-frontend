// Category tabs for filtering climate variables

import { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import CategoryPanel from './CategoryPanel';
import ParameterInfoModal from './ParameterInfoModal';
import { CATEGORY_PARAMETERS, CATEGORY_COLORS, getCategoryLabel, PARAMETER_TO_VARIABLE } from './categoryParameters';
import type { Period, Scenario } from '../../types/climate';

export type Category = "hot_weather" | "cold_weather" | "temperature" | "precipitation" | "agriculture";

const SCENARIO_LABELS: Record<Scenario, string> = {
  rcp45: "Less (RCP 4.5)",
  rcp85: "More (RCP 8.5)",
};

const PERIOD_LABELS: Record<Period, string> = {
  baseline: "Recent Past (1991-2020)",
  "2030": "2021-2050",
  "2050": "2041-2060",
  "2080": "2051-2080",
};

interface CategoryTabsProps {
  activeCategory: Category;
  onCategoryChange: (category: Category) => void;
  onParameterSelect: (variableId: string) => void;
  onParameterLabelChange?: (label: string) => void;
  onParameterDescriptionChange?: (description: string | null) => void;
  scenario: Scenario;
  period: Period;
}

// SVG Icons for each category
const SunIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
  </svg>
);

const SnowflakeIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="2" x2="12" y2="22" />
    <path d="M20 16l-4-4 4-4M4 8l4 4-4 4M16 4l-4 4-4-4M8 20l4-4 4 4" />
  </svg>
);

const ThermometerIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 4v10.54a4 4 0 1 1-4 0V4a2 2 0 0 1 4 0Z" />
  </svg>
);

const DropletIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
  </svg>
);

const LeafIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
    <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
  </svg>
);

interface CategoryConfig {
  id: Category;
  label: string;
  icon: React.FC;
}

const CATEGORIES: CategoryConfig[] = [
  { id: "hot_weather", label: "Hot Weather", icon: SunIcon },
  { id: "cold_weather", label: "Cold Weather", icon: SnowflakeIcon },
  { id: "temperature", label: "Temperature", icon: ThermometerIcon },
  { id: "precipitation", label: "Precipitation", icon: DropletIcon },
  { id: "agriculture", label: "Agriculture", icon: LeafIcon },
];

// State for tracking selections across all categories
type SelectionsState = Record<Category, string[]>;

const CategoryTabs: React.FC<CategoryTabsProps> = ({
  activeCategory,
  onCategoryChange,
  onParameterSelect,
  onParameterLabelChange,
  onParameterDescriptionChange,
  scenario,
  period,
}) => {
  // Track which panel is open
  const [openPanel, setOpenPanel] = useState<Category | null>(null);

  // Refs for each tab button to position the panel
  const tabRefs = useRef<Record<Category, HTMLButtonElement | null>>({
    hot_weather: null,
    cold_weather: null,
    temperature: null,
    precipitation: null,
    agriculture: null,
  });

  // Track parameter selections for each category
  const [selections, setSelections] = useState<SelectionsState>({
    precipitation: [],
    agriculture: [],
    hot_weather: [],
    temperature: [],
    cold_weather: [],
  });

  // Track modal state for parameter info
  const [modalParam, setModalParam] = useState<{
    id: string;
    label: string;
    categoryColor: string;
  } | null>(null);

  const handleCategoryClick = (categoryId: Category) => {
    if (openPanel === categoryId) {
      // Close if clicking same category
      setOpenPanel(null);
    } else {
      // Open panel for this category
      setOpenPanel(categoryId);
      onCategoryChange(categoryId);

      // Reset selections — user must click a parameter to update the map
      setSelections({
        precipitation: [],
        agriculture: [],
        hot_weather: [],
        temperature: [],
        cold_weather: [],
      });
    }
  };

  const handleToggleParameter = (categoryId: Category, parameterId: string) => {
    // Single-select: clear all categories, set only the clicked parameter
    setSelections({
      precipitation: [],
      agriculture: [],
      hot_weather: [],
      temperature: [],
      cold_weather: [],
      [categoryId]: [parameterId],
    });

    // Map frontend parameter to backend variable and notify parent
    const variableId = PARAMETER_TO_VARIABLE[parameterId];
    if (variableId) {
      onParameterSelect(variableId);
    }

    // Report the clicked parameter's label + description for the header
    const param = CATEGORY_PARAMETERS[categoryId].find((p) => p.id === parameterId);
    if (param && onParameterLabelChange) {
      onParameterLabelChange(param.label);
    }
    if (onParameterDescriptionChange) {
      onParameterDescriptionChange(param?.description || null);
    }

    // Open the parameter info modal
    setModalParam({
      id: parameterId,
      label: param?.label || parameterId,
      categoryColor: CATEGORY_COLORS[categoryId],
    });

    // Close the panel after selection
    setOpenPanel(null);
  };

  const handleClosePanel = () => {
    setOpenPanel(null);
  };

  const handleOpenParameterInfo = (categoryId: Category, parameterId: string, label: string) => {
    setModalParam({
      id: parameterId,
      label: label,
      categoryColor: CATEGORY_COLORS[categoryId],
    });

    // Also select this parameter for map display
    const variableId = PARAMETER_TO_VARIABLE[parameterId];
    if (variableId) {
      onParameterSelect(variableId);
    }

    const param = CATEGORY_PARAMETERS[categoryId].find((p) => p.id === parameterId);
    if (param && onParameterLabelChange) {
      onParameterLabelChange(param.label);
    }
    if (onParameterDescriptionChange) {
      onParameterDescriptionChange(param?.description || null);
    }

    // Update selections to reflect this parameter
    setSelections({
      precipitation: [],
      agriculture: [],
      hot_weather: [],
      temperature: [],
      cold_weather: [],
      [categoryId]: [parameterId],
    });
  };

  const handleCloseModal = () => {
    setModalParam(null);
  };

  return (
    <div className="category-tabs-wrapper">
      {/* Category tabs */}
      <div className="category-tabs">
        {CATEGORIES.map((cat) => {
          const IconComponent = cat.icon;
          const isOpen = openPanel === cat.id;
          const hasSelections = selections[cat.id].length > 0;
          const categoryColor = CATEGORY_COLORS[cat.id];

          return (
            <div key={cat.id} className="category-tab-container">
              {/* Panel appears above this specific tab */}
              {isOpen && (
                <div className="category-panel-anchor">
                  <CategoryPanel
                    categoryLabel={getCategoryLabel(cat.id)}
                    categoryColor={categoryColor}
                    parameters={CATEGORY_PARAMETERS[cat.id]}
                    selectedParameters={selections[cat.id]}
                    onToggleParameter={(paramId) => handleToggleParameter(cat.id, paramId)}
                    onParameterInfo={(paramId, label) => handleOpenParameterInfo(cat.id, paramId, label)}
                    onClose={handleClosePanel}
                  />
                </div>
              )}

              <button
                ref={(el) => { tabRefs.current[cat.id] = el; }}
                className={`category-tab ${activeCategory === cat.id ? "active" : ""} ${isOpen ? "panel-open" : ""}`}
                onClick={() => handleCategoryClick(cat.id)}
                type="button"
              >
                <span
                  className="tab-icon"
                  style={{ backgroundColor: categoryColor }}
                >
                  <IconComponent />
                  {hasSelections && (
                    <span className="selection-badge">
                      {selections[cat.id].length}
                    </span>
                  )}
                </span>
                <span className="tab-label">{cat.label}</span>
              </button>
            </div>
          );
        })}
      </div>

      {/* Parameter Info Modal - portaled to body to escape stacking context */}
      {modalParam && createPortal(
        <ParameterInfoModal
          parameterId={modalParam.id}
          parameterLabel={modalParam.label}
          categoryColor={modalParam.categoryColor}
          scenario={SCENARIO_LABELS[scenario]}
          timePeriod={PERIOD_LABELS[period]}
          onClose={handleCloseModal}
        />,
        document.body
      )}
    </div>
  );
};

export default CategoryTabs;
export { CATEGORY_PARAMETERS };
