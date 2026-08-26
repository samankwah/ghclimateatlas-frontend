// Loading skeleton for the map area.
//
// Shown until the basemap has actually painted and the district data has
// arrived. Previously the loading overlay tracked data only, so it cleared
// while the basemap was still blank -- which is what made the map feel slow.
//
// Written as a plain CSS shimmer rather than with react-loading-skeleton so the
// map has no extra runtime dependency; the tones match the Atlas skeleton
// palette, so it can be swapped for AtlasSkeleton later without a visual change.

import WeatherLoader from "../WeatherLoader";
import "./map-skeleton.css";

interface MapSkeletonProps {
  /** Announced to screen readers, and shown under the loader. */
  label?: string;
}

const MapSkeleton: React.FC<MapSkeletonProps> = ({ label = "Loading the map…" }) => (
  <div className="map-skeleton" role="status" aria-busy="true">
    {/* Placeholders for the legend and the variable control bar, so the
        surrounding layout does not shift when the real furniture appears. */}
    <div className="map-skeleton__block map-skeleton__legend" aria-hidden="true" />
    <div className="map-skeleton__block map-skeleton__controls" aria-hidden="true" />

    <WeatherLoader />
    <p className="map-skeleton__status" aria-hidden="true">
      {label}
    </p>
    <span className="map-skeleton__sr-only">{label}</span>
  </div>
);

export default MapSkeleton;
