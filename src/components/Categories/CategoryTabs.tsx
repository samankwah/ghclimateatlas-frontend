// Category tabs for filtering climate variables

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import CategoryPanel from './CategoryPanel';
import ParameterInfoModal from './ParameterInfoModal';
import {
  CATEGORY_PARAMETERS,
  CATEGORY_COLORS,
  getCategoryLabel,
  PARAMETER_TO_VARIABLE,
  type Parameter,
} from './categoryParameters';
import type { ClimateVariable, Period, Scenario } from '../../types/climate';

export type Category = "hot_weather" | "cold_weather" | "temperature" | "precipitation" | "agriculture";

interface CategoryTabsProps {
  activeCategory: Category;
  onCategoryChange: (category: Category) => void;
  onParameterSelect: (variableId: string, parameterId: string) => void;
  onParameterLabelChange?: (label: string) => void;
  scenario: Scenario;
  period: Period;
  availableVariables?: ClimateVariable[];
  controlsExpanded?: boolean;
}

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

type SelectionsState = Record<Category, string[]>;
type ActiveParentState = Record<Category, string | null>;
type ParameterLookupResult = {
  parameter: Parameter;
  ancestors: Parameter[];
};

const EMPTY_SELECTIONS: SelectionsState = {
  precipitation: [],
  agriculture: [],
  hot_weather: [],
  temperature: [],
  cold_weather: [],
};

const INITIAL_ACTIVE_PARENTS: ActiveParentState = {
  precipitation: null,
  agriculture: null,
  hot_weather: null,
  temperature: null,
  cold_weather: null,
};

const cloneEmptySelections = (): SelectionsState => ({
  precipitation: [],
  agriculture: [],
  hot_weather: [],
  temperature: [],
  cold_weather: [],
});

const findParameterWithAncestors = (
  parameters: Parameter[],
  parameterId: string,
  ancestors: Parameter[] = [],
): ParameterLookupResult | undefined => {
  for (const parameter of parameters) {
    if (parameter.id === parameterId) {
      return {
        parameter,
        ancestors,
      };
    }

    if (parameter.children?.length) {
      const nestedMatch = findParameterWithAncestors(
        parameter.children,
        parameterId,
        [...ancestors, parameter],
      );

      if (nestedMatch) {
        return nestedMatch;
      }
    }
  }

  return undefined;
};

const findParameterById = (categoryId: Category, parameterId: string): Parameter | undefined =>
  findParameterWithAncestors(CATEGORY_PARAMETERS[categoryId], parameterId)?.parameter;

const getAnnualFallbackVariableId = (parameter: Parameter, ancestors: Parameter[]): string | null => {
  const lineage = [...ancestors, parameter].map((item) => item.id);

  if (lineage.includes("mean_temp")) {
    return "annual_mean_temp";
  }

  if (lineage.includes("max_temp")) {
    return "annual_max_temp";
  }

  if (lineage.includes("min_temp")) {
    return "annual_min_temp";
  }

  if (lineage.includes("precipitation_total")) {
    if (parameter.id === "precipitation_growing_season") {
      return "wet_season_precipitation";
    }

    if (
      parameter.id === "precipitation_spring" ||
      parameter.id === "precipitation_summer" ||
      parameter.id === "precipitation_fall"
    ) {
      return "wet_season_precipitation";
    }

    return "annual_precipitation";
  }

  return null;
};

const getSupportedVariableId = (
  categoryId: Category,
  parameterId: string,
  availableVariableIds: Set<string>,
): string | undefined => {
  const match = findParameterWithAncestors(CATEGORY_PARAMETERS[categoryId], parameterId);
  if (!match) {
    return PARAMETER_TO_VARIABLE[parameterId];
  }

  const { parameter, ancestors } = match;
  const candidates = new Set<string>();
  const addCandidate = (candidate?: string | null) => {
    if (candidate) {
      candidates.add(candidate);
    }
  };

  addCandidate(parameter.variableId);
  addCandidate(PARAMETER_TO_VARIABLE[parameter.id]);

  for (let index = ancestors.length - 1; index >= 0; index -= 1) {
    const ancestor = ancestors[index];
    addCandidate(ancestor.variableId);
    addCandidate(PARAMETER_TO_VARIABLE[ancestor.id]);
  }

  addCandidate(getAnnualFallbackVariableId(parameter, ancestors));

  if (parameter.id === "wet_days") {
    addCandidate("wet_days");
    addCandidate("dry_days");
  }

  for (const candidate of candidates) {
    if (availableVariableIds.has(candidate)) {
      return candidate;
    }
  }

  return candidates.values().next().value;
};

const markParameterAvailability = (
  categoryId: Category,
  parameter: Parameter,
  availableVariableIds: Set<string>
): Parameter => {
  const children = parameter.children?.map((child) =>
    markParameterAvailability(categoryId, child, availableVariableIds)
  );
  const hasEnabledChild = children?.some((child) => child.disabled !== true) ?? false;
  const supportedVariableId = getSupportedVariableId(categoryId, parameter.id, availableVariableIds);
  const variableSupported = !parameter.isSelectable || !!supportedVariableId;

  const selectable = parameter.isSelectable === true || !!parameter.variableId || !children?.length;
  const disabled = parameter.disabled === true || (!hasEnabledChild && selectable && !variableSupported);

  return {
    ...parameter,
    children,
    disabled,
  };
};

const CategoryTabs: React.FC<CategoryTabsProps> = ({
  activeCategory,
  onCategoryChange,
  onParameterSelect,
  onParameterLabelChange,
  scenario,
  period,
  availableVariables,
  controlsExpanded = true,
}) => {
  const [openPanel, setOpenPanel] = useState<Category | null>(null);
  const [isMobileViewport, setIsMobileViewport] = useState(false);
  const [selections, setSelections] = useState<SelectionsState>(EMPTY_SELECTIONS);
  const [activeParents, setActiveParents] = useState<ActiveParentState>(INITIAL_ACTIVE_PARENTS);
  const [modalParam, setModalParam] = useState<{
    id: string;
    label: string;
    categoryColor: string;
  } | null>(null);

  const availableVariableIds = new Set((availableVariables ?? []).map((variable) => variable.id));
  availableVariableIds.add('dry_days');
  availableVariableIds.add('wet_days');

  const handleCategoryClick = (categoryId: Category) => {
    if (openPanel === categoryId) {
      setOpenPanel(null);
      setActiveParents(INITIAL_ACTIVE_PARENTS);
      return;
    }

    setOpenPanel(categoryId);
    onCategoryChange(categoryId);
    setActiveParents(INITIAL_ACTIVE_PARENTS);
  };

  const handleParentSelect = (categoryId: Category, parameterId: string | null) => {
    setActiveParents((current) => ({
      ...current,
      [categoryId]: parameterId,
    }));
  };

  const handleToggleParameter = (categoryId: Category, parameterId: string) => {
    const param = findParameterById(categoryId, parameterId);
    const variableId = getSupportedVariableId(categoryId, parameterId, availableVariableIds);

    if (!variableId) {
      return;
    }

    setSelections({
      ...cloneEmptySelections(),
      [categoryId]: [parameterId],
    });

    onParameterSelect(variableId, parameterId);

    if (param && onParameterLabelChange) {
      onParameterLabelChange(param.description ?? param.label);
    }

    setOpenPanel(null);
    setActiveParents(INITIAL_ACTIVE_PARENTS);
  };

  const handleOpenParameterInfo = (categoryId: Category, parameterId: string) => {
    const param = findParameterById(categoryId, parameterId);

    setModalParam({
      id: param?.infoId ?? parameterId,
      label: param?.description ?? param?.label ?? parameterId,
      categoryColor: CATEGORY_COLORS[categoryId],
    });
  };

  const handleClosePanel = () => {
    setOpenPanel(null);
    setActiveParents(INITIAL_ACTIVE_PARENTS);
  };

  const handleCloseModal = () => {
    setModalParam(null);
  };

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 768px)');
    const updateViewport = (event?: MediaQueryListEvent) => {
      setIsMobileViewport(event ? event.matches : mediaQuery.matches);
    };

    updateViewport();
    mediaQuery.addEventListener('change', updateViewport);

    return () => {
      mediaQuery.removeEventListener('change', updateViewport);
    };
  }, []);

  return (
    <div className="category-tabs-wrapper" data-tour="map-variable">
      {openPanel && (!isMobileViewport || controlsExpanded) && (
        <button
          type="button"
          className="category-panel-backdrop"
          onClick={handleClosePanel}
          aria-label="Close category panel"
        />
      )}

      <div className="category-tabs">
        {CATEGORIES.map((cat) => {
          const IconComponent = cat.icon;
          const isOpen = openPanel === cat.id;
          const hasSelections = selections[cat.id].length > 0;
          const categoryColor = CATEGORY_COLORS[cat.id];

          return (
            <div key={cat.id} className="category-tab-container">
              {isOpen && !isMobileViewport && (
                <div className="category-panel-anchor">
                  <CategoryPanel
                    panelId={`category-panel-${cat.id}`}
                    categoryLabel={getCategoryLabel(cat.id)}
                    categoryColor={categoryColor}
                    parameters={CATEGORY_PARAMETERS[cat.id].map((param) => markParameterAvailability(cat.id, param, availableVariableIds))}
                    selectedParameters={selections[cat.id]}
                    activeParentId={activeParents[cat.id]}
                    onParentSelect={(paramId) => handleParentSelect(cat.id, paramId)}
                    onToggleParameter={(paramId) => handleToggleParameter(cat.id, paramId)}
                    onOpenParameterInfo={(paramId) => handleOpenParameterInfo(cat.id, paramId)}
                    onClose={handleClosePanel}
                  />
                </div>
              )}

              <button
                className={`category-tab ${activeCategory === cat.id ? "active" : ""} ${isOpen ? "panel-open" : ""}`}
                onClick={() => handleCategoryClick(cat.id)}
                type="button"
                aria-expanded={isOpen}
                aria-controls={`category-panel-${cat.id}`}
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

      {openPanel && isMobileViewport && controlsExpanded && createPortal(
        <div className="category-panel-anchor">
          <CategoryPanel
            panelId={`category-panel-${openPanel}`}
            categoryLabel={getCategoryLabel(openPanel)}
            categoryColor={CATEGORY_COLORS[openPanel]}
            parameters={CATEGORY_PARAMETERS[openPanel].map((param) => markParameterAvailability(openPanel, param, availableVariableIds))}
            selectedParameters={selections[openPanel]}
            activeParentId={activeParents[openPanel]}
            onParentSelect={(paramId) => handleParentSelect(openPanel, paramId)}
            onToggleParameter={(paramId) => handleToggleParameter(openPanel, paramId)}
            onOpenParameterInfo={(paramId) => handleOpenParameterInfo(openPanel, paramId)}
            onClose={handleClosePanel}
          />
        </div>,
        document.body
      )}

      {modalParam && createPortal(
        <ParameterInfoModal
          parameterId={modalParam.id}
          parameterLabel={modalParam.label}
          categoryColor={modalParam.categoryColor}
          scenario={scenario}
          period={period}
          onClose={handleCloseModal}
        />,
        document.body
      )}
    </div>
  );
};

export default CategoryTabs;
export { CATEGORY_PARAMETERS };
