// District search component - floating search box over the map

import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import type { DistrictFeatureCollection } from "../../types/climate";

interface DistrictSearchProps {
  districts: DistrictFeatureCollection | undefined;
  onSelectDistrict: (districtId: string) => void;
}

interface DistrictOption {
  id: string;
  name: string;
  region: string;
}

const SearchIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const DistrictSearch: React.FC<DistrictSearchProps> = ({ districts, onSelectDistrict }) => {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Build searchable list from district GeoJSON
  const allDistricts: DistrictOption[] = useMemo(() => {
    if (!districts) return [];
    return districts.features.map((f) => ({
      id: f.properties.id,
      name: f.properties.name,
      region: f.properties.region,
    })).sort((a, b) => a.name.localeCompare(b.name));
  }, [districts]);

  // Filter districts by query
  const filtered = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return allDistricts.filter(
      (d) => d.name.toLowerCase().includes(q) || d.region.toLowerCase().includes(q)
    ).slice(0, 10); // Limit to 10 results
  }, [query, allDistricts]);

  const handleSelect = useCallback((districtId: string) => {
    onSelectDistrict(districtId);
    setQuery("");
    setIsOpen(false);
    inputRef.current?.blur();
  }, [onSelectDistrict]);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
        inputRef.current?.blur();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="district-search" ref={containerRef}>
      <div className="district-search-input-wrapper">
        <span className="district-search-icon"><SearchIcon /></span>
        <input
          ref={inputRef}
          type="text"
          className="district-search-input"
          placeholder="Search districts..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
        />
      </div>
      {isOpen && filtered.length > 0 && (
        <div className="district-search-results">
          {filtered.map((d) => (
            <button
              key={d.id}
              className="district-search-result-item"
              onClick={() => handleSelect(d.id)}
              type="button"
            >
              <span className="result-name">{d.name}</span>
              <span className="result-region">{d.region}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default DistrictSearch;
