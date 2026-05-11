// Map layer toggles - slim sidebar with icon-based toggles

import { useEffect, useRef, useState } from 'react';

interface MapLayerTogglesProps {
  showWater?: boolean;
  showStories?: boolean;
  onToggleWater?: () => void;
  onToggleStories?: () => void;
  onOpenDataRequest?: () => void;
  searchContent?: React.ReactNode;
  showChange?: boolean;
  onToggleChange?: () => void;
  changeToggleAvailable?: boolean;
}

const MapLayerToggles: React.FC<MapLayerTogglesProps> = ({
  showWater = true,
  showStories = true,
  onToggleWater,
  onToggleStories,
  onOpenDataRequest,
  searchContent,
  showChange = false,
  onToggleChange,
  changeToggleAvailable = false,
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

  const handleSearchToggle = () => {
    setSearchOpen((open) => !open);
  };

  const handleOpenDataRequest = () => {
    setSearchOpen(false);
    onOpenDataRequest?.();
  };

  return (
    <aside ref={asideRef} className="slim-sidebar" data-tour="map-tools">
      <div className="layer-toggles">
        {/* Search toggle */}
        <button
          className={`layer-toggle ${searchOpen ? "active" : ""}`}
          onClick={handleSearchToggle}
          title="Search Districts"
          aria-expanded={searchOpen}
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

        {onOpenDataRequest && (
          <button
            className="layer-toggle"
            onClick={handleOpenDataRequest}
            title="Request Climate Data Download"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            <span className="toggle-label">Data</span>
          </button>
        )}

        {onToggleChange && changeToggleAvailable && (
          <button
            className={`layer-toggle ${showChange ? "active" : ""}`}
            onClick={onToggleChange}
            title="Show change from baseline"
            aria-pressed={showChange}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
              <polyline points="17 6 23 6 23 12" />
            </svg>
            <span className="toggle-label">Change</span>
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
