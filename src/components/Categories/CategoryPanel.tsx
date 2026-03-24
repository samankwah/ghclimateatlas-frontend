// Dropdown panel for selecting climate parameters - matches Canada Climate Atlas style

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { Parameter } from './categoryParameters';

interface CategoryPanelProps {
  panelId?: string;
  categoryLabel: string;
  categoryColor: string;
  parameters: Parameter[];
  selectedParameters: string[];
  activeParentId?: string | null;
  onParentSelect?: (parameterId: string | null) => void;
  onToggleParameter: (parameterId: string) => void;
  onOpenParameterInfo: (parameterId: string) => void;
  onClose: () => void;
}

const CloseIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const ExpandArrow = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
    <path d="M8 5v14l11-7z" />
  </svg>
);

const BackArrow = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6" />
  </svg>
);

const InfoIcon = () => <span aria-hidden="true">i</span>;

const SelectedMark = () => (
  <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
    <path d="M2 2l6 6" />
    <path d="M8 2L2 8" />
  </svg>
);

const SelectionIndicator: React.FC<{ selected: boolean }> = ({ selected }) => (
  <span className={`category-panel-checkbox ${selected ? 'selected' : ''}`} aria-hidden="true">
    {selected && (
      <span className="category-panel-checkbox-mark">
        <SelectedMark />
      </span>
    )}
  </span>
);

const CategoryPanel: React.FC<CategoryPanelProps> = ({
  panelId,
  categoryLabel,
  categoryColor,
  parameters,
  selectedParameters,
  activeParentId,
  onParentSelect,
  onToggleParameter,
  onOpenParameterInfo,
  onClose,
}) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const submenuRef = useRef<HTMLDivElement>(null);
  const hasNestedParameters = parameters.some((param) => (param.children?.length ?? 0) > 0);
  const activeParent = parameters.find((param) => param.id === activeParentId) ?? null;
  const activeChildren = useMemo(
    () => (hasNestedParameters ? activeParent?.children ?? [] : []),
    [activeParent, hasNestedParameters]
  );
  const [isMobileViewport, setIsMobileViewport] = useState(false);
  const [submenuPosition, setSubmenuPosition] = useState({ bottom: 0, left: 0 });

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const targetNode = event.target as Node;
      const insidePanel = panelRef.current?.contains(targetNode);
      const insideSubmenu = submenuRef.current?.contains(targetNode);

      if (!insidePanel && !insideSubmenu) {
        const target = event.target as HTMLElement;
        if (!target.closest('.category-tab')) {
          onClose();
        }
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

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

  useLayoutEffect(() => {
    if (isMobileViewport) {
      return;
    }

    if (!hasNestedParameters || !activeParent || !panelRef.current || !submenuRef.current) {
      return;
    }

    const updateLayout = () => {
      const panelRect = panelRef.current!.getBoundingClientRect();
      const bottom = Math.max(window.innerHeight - panelRect.bottom, 16);

      setSubmenuPosition((current) => (
        current.bottom === bottom && current.left === panelRect.right
          ? current
          : {
              bottom,
              left: panelRect.right,
            }
      ));
    };

    updateLayout();
    window.addEventListener('resize', updateLayout);
    window.addEventListener('scroll', updateLayout, true);

    return () => {
      window.removeEventListener('resize', updateLayout);
      window.removeEventListener('scroll', updateLayout, true);
    };
  }, [activeParent, activeChildren, hasNestedParameters, isMobileViewport]);

  const isParameterSelected = (parameter: Parameter): boolean => {
    if (selectedParameters.includes(parameter.id)) {
      return true;
    }

    return (parameter.children ?? []).some((child) => selectedParameters.includes(child.id));
  };

  const renderSubmenuItems = (items: Parameter[], depth = 0): React.ReactNode => (
    items.map((item) => {
      const isSelected = selectedParameters.includes(item.id);
      const isSelectable = item.isSelectable === true && item.disabled !== true;
      const handleInfoOpen = (event: React.MouseEvent | React.KeyboardEvent) => {
        event.stopPropagation();
        onOpenParameterInfo(item.id);
      };

      if (isMobileViewport && depth === 0 && item.children?.length) {
        const isGroupSelected = selectedParameters.includes(item.id);
        return (
          <div key={item.id} className="category-subpanel-group mobile-grouped">
            <div
              className={`category-subpanel-item ${isGroupSelected ? 'selected' : ''} ${isSelectable ? 'selectable' : 'static'} ${item.disabled ? 'disabled' : ''}`}
              onClick={isSelectable ? () => onToggleParameter(item.id) : undefined}
              role={isSelectable ? "button" : undefined}
              tabIndex={isSelectable ? 0 : -1}
              onKeyDown={(e) => {
                if (isSelectable && (e.key === 'Enter' || e.key === ' ')) {
                  e.preventDefault();
                  onToggleParameter(item.id);
                }
              }}
            >
              <SelectionIndicator selected={isGroupSelected} />
              <span className="category-subpanel-label">{item.label}</span>
              <button
                type="button"
                className="category-panel-info-btn"
                aria-label={`Open information for ${item.label}`}
                onClick={handleInfoOpen}
              >
                <InfoIcon />
              </button>
            </div>
            <div className="category-subpanel-children-row">
              {item.children.map((child) => {
                const isChildSelected = selectedParameters.includes(child.id);
                const isChildSelectable = child.isSelectable === true && child.disabled !== true;
                return (
                <div
                  key={child.id}
                  className={`category-subpanel-child-chip ${isChildSelected ? 'selected' : ''} ${isChildSelectable ? 'selectable' : 'static'} ${child.disabled ? 'disabled' : ''}`}
                  onClick={isChildSelectable ? () => onToggleParameter(child.id) : undefined}
                  role={isChildSelectable ? "button" : undefined}
                  tabIndex={isChildSelectable ? 0 : -1}
                  onKeyDown={(e) => {
                    if (isChildSelectable && (e.key === 'Enter' || e.key === ' ')) {
                      e.preventDefault();
                      onToggleParameter(child.id);
                    }
                  }}
                >
                  <SelectionIndicator selected={selectedParameters.includes(child.id)} />
                  <span className="category-subpanel-label">{child.label}</span>
                  <button
                    type="button"
                    className="category-panel-info-btn"
                    aria-label={`Open information for ${child.label}`}
                    onClick={(event) => {
                      event.stopPropagation();
                      onOpenParameterInfo(child.id);
                    }}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.stopPropagation();
                      }
                    }}
                  >
                    <InfoIcon />
                  </button>
                </div>
                );
              })}
            </div>
          </div>
        );
      }

      return (
        <div key={item.id} className="category-subpanel-group">
          <div
            className={`category-subpanel-item ${isSelected ? 'selected' : ''} ${isSelectable ? 'selectable' : 'static'} ${item.disabled ? 'disabled' : ''}`}
            onClick={isSelectable ? () => onToggleParameter(item.id) : undefined}
            role={isSelectable ? "button" : undefined}
            tabIndex={isSelectable ? 0 : -1}
            style={{ paddingLeft: `${14 + depth * 22}px` }}
            onKeyDown={(e) => {
              if (isSelectable && (e.key === 'Enter' || e.key === ' ')) {
                e.preventDefault();
                onToggleParameter(item.id);
              }
            }}
          >
            <SelectionIndicator selected={isSelected} />
            <span className="category-subpanel-label">{item.label}</span>
            <button
              type="button"
              className="category-panel-info-btn"
              aria-label={`Open information for ${item.label}`}
              onClick={handleInfoOpen}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.stopPropagation();
                }
              }}
            >
              <InfoIcon />
            </button>
          </div>
          {item.children?.length ? renderSubmenuItems(item.children, depth + 1) : null}
        </div>
      );
    })
  );

  const desktopSubmenu = hasNestedParameters && activeParent && !isMobileViewport
    ? createPortal(
        <div
          key={activeParent.id}
          ref={submenuRef}
          className={`category-subpanel category-subpanel-floating ${categoryLabel === 'RAINFALL' ? 'category-subpanel-precipitation' : ''}`}
          aria-label={`${activeParent.label} options`}
          style={{
            bottom: `${submenuPosition.bottom}px`,
            left: `${submenuPosition.left}px`,
          }}
        >
          <div className="category-subpanel-body">
            {renderSubmenuItems(activeChildren)}
          </div>
        </div>,
        document.body
      )
    : null;

  const showMobileSubmenu = isMobileViewport && hasNestedParameters && activeParent;

  return (
    <div ref={panelRef} className={`category-panel-layout ${hasNestedParameters ? 'has-secondary-panel' : ''}`}>
      <div className="category-panel" id={panelId}>
        <div className="category-panel-header" style={{ backgroundColor: categoryColor }}>
          <span className="category-panel-title">{categoryLabel}</span>
          <button className="category-panel-close" onClick={onClose} type="button">
            <CloseIcon />
          </button>
        </div>

        <div className={`category-panel-body ${hasNestedParameters ? 'with-flyout' : ''}`}>
          {!showMobileSubmenu && parameters.map((param) => {
            const isSelected = isParameterSelected(param);
            const isActiveParent = hasNestedParameters && activeParent?.id === param.id;
            const isDisabled = param.disabled === true;
            const handleActivate = () => {
              if (isDisabled) {
                return;
              }

              if (param.children?.length) {
                onParentSelect?.(param.id);
                return;
              }

              onToggleParameter(param.id);
            };

            return (
              <div
                key={param.id}
                className={`category-panel-item ${isSelected ? 'selected' : ''} ${isActiveParent ? 'active-parent' : ''} ${isDisabled ? 'disabled' : ''}`}
                onClick={isDisabled ? undefined : handleActivate}
                role={isDisabled ? undefined : "button"}
                tabIndex={isDisabled ? -1 : 0}
                onKeyDown={(e) => {
                  if (!isDisabled && (e.key === 'Enter' || e.key === ' ')) {
                    e.preventDefault();
                    handleActivate();
                  }
                }}
              >
                {param.isExpandable ? (
                  <span className={`expand-arrow ${isActiveParent ? 'expanded' : ''}`}>
                    <ExpandArrow />
                  </span>
                ) : (
                  <SelectionIndicator selected={isSelected} />
                )}
                <span className="category-panel-label-group">
                  <span className="category-panel-label">
                    {param.label}
                  </span>
                </span>
                <button
                  type="button"
                  className="category-panel-info-btn"
                  aria-label={`Open information for ${param.label}`}
                  onClick={(event) => {
                    event.stopPropagation();
                    onOpenParameterInfo(param.id);
                  }}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.stopPropagation();
                    }
                  }}
                >
                  <InfoIcon />
                </button>
              </div>
            );
          })}

          {showMobileSubmenu && (
            <div
              key={activeParent.id}
              ref={submenuRef}
              className={`category-subpanel ${categoryLabel === 'RAINFALL' ? 'category-subpanel-precipitation' : ''}`}
              aria-label={`${activeParent.label} options`}
            >
              <button
                type="button"
                className="category-subpanel-back"
                onClick={() => onParentSelect?.(null)}
              >
                <BackArrow />
                <span>{activeParent.label}</span>
              </button>
              <div className="category-subpanel-body">
                {renderSubmenuItems(activeChildren)}
              </div>
            </div>
          )}
        </div>
      </div>
      {desktopSubmenu}
    </div>
  );
};

export default CategoryPanel;
