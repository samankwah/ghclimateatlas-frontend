// Dropdown panel for selecting climate parameters - matches Canada Climate Atlas style

import { useEffect, useRef } from 'react';
import type { Parameter } from './categoryParameters';

interface CategoryPanelProps {
  categoryLabel: string;
  categoryColor: string;
  parameters: Parameter[];
  selectedParameters: string[];
  onToggleParameter: (parameterId: string) => void;
  onParameterInfo: (parameterId: string, label: string) => void;
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

const CategoryPanel: React.FC<CategoryPanelProps> = ({
  categoryLabel,
  categoryColor,
  parameters,
  selectedParameters,
  onToggleParameter,
  onParameterInfo,
  onClose,
}) => {
  const panelRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        // Check if clicking on a category tab button
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

  return (
    <div ref={panelRef} className="category-panel">
      {/* Header */}
      <div className="category-panel-header" style={{ backgroundColor: categoryColor }}>
        <span className="category-panel-title">{categoryLabel}</span>
        <button className="category-panel-close" onClick={onClose}>
          <CloseIcon />
        </button>
      </div>

      {/* Parameter list */}
      <div className="category-panel-body">
        {parameters.map((param) => (
          <div
            key={param.id}
            className={`category-panel-item ${selectedParameters.includes(param.id) ? 'selected' : ''}`}
            onClick={() => onToggleParameter(param.id)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onToggleParameter(param.id);
              }
            }}
          >
            {param.isExpandable ? (
              <span className="expand-arrow">
                <ExpandArrow />
              </span>
            ) : (
              <input
                type="checkbox"
                checked={false}
                readOnly
                className="category-panel-checkbox"
              />
            )}
            <span className="category-panel-label-group">
              <span className="category-panel-label">
                {param.label}
              </span>
              {param.description && (
                <span className="category-panel-description">{param.description}</span>
              )}
            </span>
            <span
              className="category-panel-info-btn"
              onClick={(e) => {
                e.stopPropagation();
                onParameterInfo(param.id, param.label);
              }}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  e.stopPropagation();
                  onParameterInfo(param.id, param.label);
                }
              }}
            >
              i
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CategoryPanel;
