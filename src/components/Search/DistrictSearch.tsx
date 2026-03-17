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
  aliases: string[];
  searchTerms: string[];
  normalizedName: string;
  normalizedRegion: string;
  normalizedAliases: string[];
}

const DISTRICT_ALIASES: Record<string, string[]> = {
  "Accra Metropolitan": ["accra", "accrax", "greater accra capital"],
  "Kumasi Metropolitan": ["kumasi", "ashanti capital"],
  "Sekondi-Takoradi Metropolitan": ["takoradi", "sekondi", "sekondi takoradi", "western capital"],
  "Cape Coast Metropolitan": ["cape coast", "central capital"],
  "New Juaben South": ["koforidua", "new juaben", "eastern capital"],
  "Ho Municipal": ["ho", "volta capital"],
  "Tamale Metropolitan": ["tamale", "northern capital"],
  "Bolgatanga Municipal": ["bolgatanga", "upper east capital"],
  "Wa Municipal": ["wa", "upper west capital"],
  "Sunyani Municipal": ["sunyani", "bono capital"],
  "Techiman Municipal": ["techiman", "bono east capital"],
  "Goaso": ["goaso", "ahafo capital"],
  "Sefwi-Wiawso": ["sefwi wiawso", "western north capital"],
  "Dambai": ["dambai", "oti capital"],
  "Nalerigu-Gambaga": ["nalerigu", "gambaga", "north east capital"],
  "West Mamprusi": ["walewale"],
  "Damongo": ["damongo", "savannah capital"],
  "Tema Metropolitan": ["tema"],
};

const REGION_CAPITAL_DISTRICTS: Record<string, string[]> = {
  "Greater Accra": ["Accra Metropolitan"],
  "Ashanti": ["Kumasi Metropolitan"],
  "Western": ["Sekondi-Takoradi Metropolitan"],
  "Central": ["Cape Coast Metropolitan"],
  "Eastern": ["New Juaben South"],
  "Volta": ["Ho Municipal"],
  "Northern": ["Tamale Metropolitan"],
  "Upper East": ["Bolgatanga Municipal"],
  "Upper West": ["Wa Municipal"],
  "Bono": ["Sunyani Municipal"],
  "Bono East": ["Techiman Municipal"],
  "Ahafo": ["Goaso"],
  "Western North": ["Sefwi-Wiawso"],
  "Oti": ["Dambai"],
  "North East": ["Nalerigu-Gambaga", "West Mamprusi"],
  "Savannah": ["Damongo"],
};

const normalizeSearchTerm = (value: string): string =>
  value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

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
    return districts.features.map((f) => {
      const regionAliases = REGION_CAPITAL_DISTRICTS[f.properties.region]?.includes(f.properties.name)
        ? [f.properties.region, `${f.properties.region} region`]
        : [];
      const aliases = [...(DISTRICT_ALIASES[f.properties.name] ?? []), ...regionAliases];
      const normalizedName = normalizeSearchTerm(f.properties.name);
      const normalizedRegion = normalizeSearchTerm(f.properties.region);
      const normalizedAliases = aliases.map(normalizeSearchTerm);

      return {
        id: f.properties.id,
        name: f.properties.name,
        region: f.properties.region,
        aliases,
        normalizedName,
        normalizedRegion,
        normalizedAliases,
        searchTerms: [
          normalizedName,
          normalizedRegion,
          ...normalizedAliases,
        ],
      };
    }).sort((a, b) => a.name.localeCompare(b.name));
  }, [districts]);

  // Filter districts by query
  const filtered = useMemo(() => {
    if (!query.trim()) return [];
    const q = normalizeSearchTerm(query);

    return allDistricts
      .map((district) => {
        const exactAliasMatch = district.normalizedAliases.includes(q);
        const exactNameMatch = district.normalizedName === q;
        const exactRegionMatch = district.normalizedRegion === q;
        const aliasStartsWith = district.normalizedAliases.some((alias) => alias.startsWith(q));
        const nameStartsWith = district.normalizedName.startsWith(q);
        const regionStartsWith = district.normalizedRegion.startsWith(q);
        const tokenStartsWith = district.searchTerms.some((term) =>
          term.split(" ").some((token) => token.startsWith(q))
        );
        const containsMatch = q.length > 2 && district.searchTerms.some((term) => term.includes(q));

        if (
          !(
            exactAliasMatch ||
            exactNameMatch ||
            exactRegionMatch ||
            aliasStartsWith ||
            nameStartsWith ||
            regionStartsWith ||
            tokenStartsWith ||
            containsMatch
          )
        ) {
          return null;
        }

        const score =
          exactAliasMatch ? 0 :
          exactNameMatch ? 1 :
          aliasStartsWith ? 2 :
          nameStartsWith ? 3 :
          exactRegionMatch ? 4 :
          regionStartsWith ? 5 :
          tokenStartsWith ? 6 :
          7;

        return { district, score };
      })
      .filter((entry): entry is { district: DistrictOption; score: number } => entry !== null)
      .sort((a, b) => a.score - b.score || a.district.name.length - b.district.name.length || a.district.name.localeCompare(b.district.name))
      .slice(0, 10)
      .map((entry) => entry.district);
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
          placeholder="Search districts, regions, or capitals..."
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
              {d.region ? <span className="result-region">{d.region}</span> : null}
            </button>
          ))}
        </div>
      )}
      {isOpen && query.trim() && filtered.length === 0 && (
        <div className="district-search-empty">
          No districts match "{query.trim()}".
        </div>
      )}
    </div>
  );
};

export default DistrictSearch;
