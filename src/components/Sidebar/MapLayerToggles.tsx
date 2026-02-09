// Map layer toggles - slim sidebar with icon-based toggles

import { useState } from 'react';

interface MapLayerTogglesProps {
  showGrid: boolean;
  showAverage: boolean;
  showCities: boolean;
  onToggleGrid: () => void;
  onToggleAverage: () => void;
  onToggleCities: () => void;
  searchContent?: React.ReactNode;
}

const MapLayerToggles: React.FC<MapLayerTogglesProps> = ({
  showGrid,
  showAverage,
  showCities,
  onToggleGrid,
  onToggleAverage,
  onToggleCities,
  searchContent,
}) => {
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <aside className="slim-sidebar">
      <div className="layer-toggles">
        {/* Search toggle */}
        <button
          className={`layer-toggle ${searchOpen ? "active" : ""}`}
          onClick={() => setSearchOpen(!searchOpen)}
          title="Search Districts"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <span className="toggle-label">Search</span>
        </button>

        <button
          className={`layer-toggle ${showGrid ? "active" : ""}`}
          onClick={onToggleGrid}
          title="Toggle Grid"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <line x1="3" y1="9" x2="21" y2="9" />
            <line x1="3" y1="15" x2="21" y2="15" />
            <line x1="9" y1="3" x2="9" y2="21" />
            <line x1="15" y1="3" x2="15" y2="21" />
          </svg>
          <span className="toggle-label">Grid</span>
        </button>

        <button
          className={`layer-toggle ${showAverage ? "active" : ""}`}
          onClick={onToggleAverage}
          title="Toggle Average"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 3v18h18" />
            <path d="M18 9l-5 5-4-4-6 6" />
          </svg>
          <span className="toggle-label">Avg</span>
        </button>

        <button
          className={`layer-toggle ${showCities ? "active" : ""}`}
          onClick={onToggleCities}
          title="Toggle Cities & Towns"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 21h18" />
            <path d="M5 21V7l8-4v18" />
            <path d="M19 21V11l-6-4" />
            <path d="M9 9v.01" />
            <path d="M9 12v.01" />
            <path d="M9 15v.01" />
            <path d="M9 18v.01" />
          </svg>
          <span className="toggle-label">Cities</span>
        </button>
      </div>

      {/* Search panel - slides out next to sidebar */}
      {searchOpen && searchContent && (
        <div className="sidebar-search-panel">
          {searchContent}
        </div>
      )}
    </aside>
  );
};

export default MapLayerToggles;
