// Map layer toggles - slim sidebar with icon-based toggles

import { useEffect, useRef, useState } from 'react';

interface MapLayerTogglesProps {
  showCities: boolean;
  showWater?: boolean;
  showStories?: boolean;
  onToggleWater?: () => void;
  onToggleCities: () => void;
  onToggleStories?: () => void;
  searchContent?: React.ReactNode;
}

const MapLayerToggles: React.FC<MapLayerTogglesProps> = ({
  showCities,
  showWater = true,
  showStories = true,
  onToggleWater,
  onToggleCities,
  onToggleStories,
  searchContent,
}) => {
  const [searchOpen, setSearchOpen] = useState(false);
  const asideRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!searchOpen) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (!asideRef.current?.contains(event.target as Node)) {
        setSearchOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setSearchOpen(false);
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [searchOpen]);

  return (
    <aside ref={asideRef} className="slim-sidebar" data-tour="map-tools">
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

        {onToggleWater && (
          <button
            className={`layer-toggle ${showWater ? "active" : ""}`}
            onClick={onToggleWater}
            title="Toggle Water Bodies"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
            </svg>
            <span className="toggle-label">Water</span>
          </button>
        )}

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

        {onToggleStories && (
          <button
            className={`layer-toggle ${showStories ? "active" : ""}`}
            onClick={onToggleStories}
            title="Toggle Climate Stories"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            </svg>
            <span className="toggle-label">Stories</span>
          </button>
        )}
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
