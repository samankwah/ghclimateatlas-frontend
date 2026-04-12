// Category tabs for filtering climate variables

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import CategoryPanel from './CategoryPanel';
import ParameterInfoModal from './ParameterInfoModal';
import {
  CATEGORY_PARAMETERS,
  CATEGORY_COLORS,
  getCategoryLabel,
  getParameterVariableId,
  hasDerivedVariableSources,
  type Parameter,
} from './categoryParameters';
import type { ClimateVariable, Period, Scenario } from '../../types/climate';

const TABLET_BREAKPOINT = 1100;
const MOBILE_BREAKPOINT = 768;

export type Category = "temperature" | "precipitation" | "sea_level";

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

const WavesIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 14c1.4 0 1.4-1 2.8-1s1.4 1 2.8 1 1.4-1 2.8-1 1.4 1 2.8 1 1.4-1 2.8-1 1.4 1 2.8 1" />
    <path d="M2 18c1.4 0 1.4-1 2.8-1s1.4 1 2.8 1 1.4-1 2.8-1 1.4 1 2.8 1 1.4-1 2.8-1 1.4 1 2.8 1" />
    <path d="M4 10c2.5-3 5-4 8-4s5.5 1 8 4" />
  </svg>
);

interface CategoryConfig {
  id: Category;
  label: string;
  icon: React.FC;
}

const CATEGORIES: CategoryConfig[] = [
  { id: "temperature", label: "Temperature", icon: ThermometerIcon },
  { id: "precipitation", label: "Rainfall", icon: DropletIcon },
  { id: "sea_level", label: "Sea Level", icon: WavesIcon },
];

type SelectionsState = Record<Category, string[]>;
type ParameterLookupResult = {
  parameter: Parameter;
  ancestors: Parameter[];
};

const EMPTY_SELECTIONS: SelectionsState = {
  precipitation: [],
  temperature: [],
  sea_level: [],
};

const cloneEmptySelections = (): SelectionsState => ({
  precipitation: [],
  temperature: [],
  sea_level: [],
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

const getSupportedVariableId = (
  categoryId: Category,
  parameterId: string,
  availableVariableIds: Set<string>,
): string | undefined => {
  const match = findParameterWithAncestors(CATEGORY_PARAMETERS[categoryId], parameterId);
  if (!match) {
    return getParameterVariableId(parameterId);
  }

  const { parameter, ancestors } = match;
  const candidates = new Set<string>();
  const addCandidate = (candidate?: string | null) => {
    if (candidate) {
      candidates.add(candidate);
    }
  };

  addCandidate(parameter.variableId);
  addCandidate(getParameterVariableId(parameter.id));

  for (let index = ancestors.length - 1; index >= 0; index -= 1) {
    const ancestor = ancestors[index];
    addCandidate(ancestor.variableId);
    addCandidate(getParameterVariableId(ancestor.id));
  }

  if (hasDerivedVariableSources(parameter.id, availableVariableIds)) {
    addCandidate(parameter.id);
  }

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
  const [isTabletOrSmaller, setIsTabletOrSmaller] = useState(false);
  const [isMobileViewport, setIsMobileViewport] = useState(false);
  const [selections, setSelections] = useState<SelectionsState>(EMPTY_SELECTIONS);
  const [modalParam, setModalParam] = useState<{
    id: string;
    label: string;
    categoryColor: string;
  } | null>(null);

  const availableVariableIds = new Set((availableVariables ?? []).map((variable) => variable.id));

  const handleCategoryClick = (categoryId: Category) => {
    if (openPanel === categoryId) {
      setOpenPanel(null);
      return;
    }

    setOpenPanel(categoryId);
    onCategoryChange(categoryId);
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
  };

  const handleOpenParameterInfo = (categoryId: Category, parameterId: string) => {
    const param = findParameterById(categoryId, parameterId);

    setModalParam({
      id: parameterId,
      label: param?.description ?? param?.label ?? parameterId,
      categoryColor: CATEGORY_COLORS[categoryId],
    });
  };

  const handleClosePanel = () => {
    setOpenPanel(null);
  };

  const handleCloseModal = () => {
    setModalParam(null);
  };

  useEffect(() => {
    const tabletQuery = window.matchMedia(`(max-width: ${TABLET_BREAKPOINT}px)`);
    const mobileQuery = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT}px)`);

    const updateTablet = () => setIsTabletOrSmaller(tabletQuery.matches);
    const updateMobile = () => setIsMobileViewport(mobileQuery.matches);

    updateTablet();
    updateMobile();
    tabletQuery.addEventListener('change', updateTablet);
    mobileQuery.addEventListener('change', updateMobile);

    return () => {
      tabletQuery.removeEventListener('change', updateTablet);
      mobileQuery.removeEventListener('change', updateMobile);
    };
  }, []);

  return (
    <div className="category-tabs-wrapper" data-tour="map-variable">
      {openPanel && (!isTabletOrSmaller || !isMobileViewport || controlsExpanded) && (
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
              {isOpen && !isTabletOrSmaller && (
                <div className="category-panel-anchor">
                  <CategoryPanel
                    panelId={`category-panel-${cat.id}`}
                    categoryLabel={getCategoryLabel(cat.id)}
                    categoryColor={categoryColor}
                    parameters={CATEGORY_PARAMETERS[cat.id].map((param) => markParameterAvailability(cat.id, param, availableVariableIds))}
                    selectedParameters={selections[cat.id]}
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

      {openPanel && isTabletOrSmaller && (!isMobileViewport || controlsExpanded) && createPortal(
        <div className="category-panel-anchor">
          <CategoryPanel
            panelId={`category-panel-${openPanel}`}
            categoryLabel={getCategoryLabel(openPanel)}
            categoryColor={CATEGORY_COLORS[openPanel]}
            parameters={CATEGORY_PARAMETERS[openPanel].map((param) => markParameterAvailability(openPanel, param, availableVariableIds))}
            selectedParameters={selections[openPanel]}
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
