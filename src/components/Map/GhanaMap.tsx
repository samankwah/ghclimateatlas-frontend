// Main Ghana Map component using Leaflet

import { MapContainer, TileLayer, GeoJSON, useMap } from "react-leaflet";
import { memo, useEffect, useMemo, useRef, useCallback } from "react";
import L from "leaflet";
import type { Layer, PathOptions } from "leaflet";
import type { Feature, GeoJsonObject } from "geojson";
import type {
  DistrictFeatureCollection,
  ClimateValue,
  ClimateComparison,
} from "../../types/climate";
import { getColorScale, type ColorScaleType } from "../../utils/colorScales";
import CityMarkers from "./CityMarkers";
import ClimateStoryMarkers from "./ClimateStoryMarkers";
import InterpolatedLayer from "./InterpolatedLayer";
import RegionalBoundaries from "./RegionalBoundaries";
import WaterBodiesLayer from "./WaterBodiesLayer";
import MapZoomControls from "./MapZoomControls";
import GraticuleLayer from "./GraticuleLayer";
import type { DataPoint } from "../../utils/idwInterpolation";
import "leaflet/dist/leaflet.css";

interface GhanaMapProps {
  districts: DistrictFeatureCollection | undefined;
  climateData: ClimateValue[] | undefined;
  comparisonData: ClimateComparison[] | undefined;
  showChange: boolean;
  colorScaleType: ColorScaleType;
  minValue: number;
  maxValue: number;
  selectedDistrictId: string | null;
  onDistrictClick: (districtId: string) => void;
  onDistrictHover: (districtId: string | null) => void;
  showCities?: boolean;
  dataVersion?: string;
  showGrid?: boolean;
  showWater?: boolean;
  showStories?: boolean;
}

// Ghana center coordinates
const GHANA_CENTER: [number, number] = [7.9465, -1.0232];
const GHANA_ZOOM = 7;

// Map bounds for Ghana
const GHANA_BOUNDS: [[number, number], [number, number]] = [
  [4.5, -3.5],  // Southwest
  [12, 1.5],  // Northeast
];

// Desktop-only max bounds (wider than fit bounds to allow some breathing room)
const DESKTOP_MAX_BOUNDS: [[number, number], [number, number]] = [
  [2, -6],   // Southwest
  [14, 4],   // Northeast
];

// Component to fit map to Ghana bounds
const FitBounds = () => {
  const map = useMap();
  useEffect(() => {
    const isMobile = window.innerWidth <= 768;
    if (isMobile) {
      map.fitBounds(GHANA_BOUNDS, {
        paddingTopLeft: [0, 0],
        paddingBottomRight: [0, 50],
      });
    } else {
      map.fitBounds(GHANA_BOUNDS, {
        paddingTopLeft: [20, 10],
        paddingBottomRight: [20, 150],
      });
      map.setMaxBounds(DESKTOP_MAX_BOUNDS);
    }
  }, [map]);
  return null;
};

const GhanaMap: React.FC<GhanaMapProps> = ({
  districts,
  climateData,
  comparisonData,
  showChange,
  colorScaleType,
  minValue,
  maxValue,
  selectedDistrictId,
  onDistrictClick,
  onDistrictHover,
  showCities = false,
  dataVersion,
  showGrid = false,
  showWater = true,
  showStories = false,
}) => {
  // Create a lookup map for climate values
  const valueMap = useMemo(() => {
    const map = new Map<string, number>();
    if (showChange && comparisonData) {
      comparisonData.forEach((d) => map.set(d.district_id, d.change));
    } else if (climateData) {
      climateData.forEach((d) => map.set(d.district_id, d.value));
    }
    return map;
  }, [climateData, comparisonData, showChange]);

  // Create data points from districts + climate values for IDW interpolation
  const dataPoints: DataPoint[] = useMemo(() => {
    if (!districts) return [];

    return districts.features
      .map((district) => {
        const centroid = district.properties.centroid;
        const value = valueMap.get(district.properties.id);

        if (!centroid || value === undefined) return null;

        return {
          lat: centroid[1], // latitude
          lon: centroid[0], // longitude
          value,
        };
      })
      .filter((point): point is DataPoint => point !== null);
  }, [districts, valueMap]);

  // Get stable color scale function (only changes when scale type changes)
  const colorFn = useMemo(
    () => getColorScale(showChange ? "diverging" : colorScaleType),
    [colorScaleType, showChange]
  );

  // Ref to track all GeoJSON layers by district ID for imperative style updates
  const layersRef = useRef<Map<string, L.Path>>(new Map());

  // Style function for GeoJSON features - borders only, no fill (interpolated layer handles colors)
  const getStyle = useCallback((_districtId: string, isSelected: boolean): PathOptions => {
    return {
      fillOpacity: 0,
      weight: isSelected ? 2 : 0.5,
      color: isSelected ? "#fff" : "#333",
      opacity: isSelected ? 0.8 : 0.3,
    };
  }, []);

  const style = useCallback((feature: Feature | undefined): PathOptions => {
    if (!feature?.properties) {
      return { fillOpacity: 0, weight: 0.5, color: "#333", opacity: 0.3 };
    }
    const districtId = feature.properties.id as string;
    return getStyle(districtId, districtId === selectedDistrictId);
  }, [selectedDistrictId, getStyle]);

  // Imperatively update styles when selectedDistrictId changes (no GeoJSON re-mount)
  const prevSelectedRef = useRef<string | null>(null);
  useEffect(() => {
    const prev = prevSelectedRef.current;
    const curr = selectedDistrictId;
    prevSelectedRef.current = curr;

    // Deselect previous
    if (prev && layersRef.current.has(prev)) {
      layersRef.current.get(prev)!.setStyle(getStyle(prev, false));
    }
    // Select current
    if (curr && layersRef.current.has(curr)) {
      layersRef.current.get(curr)!.setStyle(getStyle(curr, true));
    }
  }, [selectedDistrictId, getStyle]);

  // Event handlers for each feature
  const onEachFeature = useCallback((feature: Feature, layer: Layer) => {
    const districtId = feature.properties?.id as string;
    const districtName = feature.properties?.name as string;
    const region = feature.properties?.region as string;

    // Store reference for imperative updates
    layersRef.current.set(districtId, layer as L.Path);

    // Tooltip - will be updated when valueMap changes via GeoJSON key
    const value = valueMap.get(districtId);
    const tooltipContent = `
      <strong>${districtName}</strong><br/>
      ${region}<br/>
      ${value !== undefined ? `Value: ${value.toFixed(1)}` : "No data"}
    `;
    layer.bindTooltip(tooltipContent, { sticky: true });

    // Events
    layer.on({
      click: () => onDistrictClick(districtId),
      mouseover: () => onDistrictHover(districtId),
      mouseout: () => onDistrictHover(null),
    });
  }, [valueMap, onDistrictClick, onDistrictHover]);

  if (!districts) {
    return (
      <div className="map-loading">
        <p>Loading map data...</p>
      </div>
    );
  }

  return (
    <MapContainer
      center={GHANA_CENTER}
      zoom={GHANA_ZOOM}
      className="ghana-map"
      zoomControl={false}
      scrollWheelZoom={true}
      maxBoundsViscosity={1.0}
      minZoom={6}
      zoomSnap={0.5}
    >
      <FitBounds />

      {/* Dark tile layer */}
      <TileLayer
        attribution='&copy; <a href="https://carto.com/">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      />

      {/* IDW Interpolated climate layer */}
      {dataPoints.length > 0 && (
        <InterpolatedLayer
          dataPoints={dataPoints}
          colorScale={colorFn}
          minValue={minValue}
          maxValue={maxValue}
          resolution={0.1}
          opacity={0.75}
          idwPower={2}
        />
      )}

      {/* Water bodies layer */}
      <WaterBodiesLayer visible={showWater} />

      {/* District polygons (borders only) */}
      <GeoJSON
        key={dataVersion}
        data={districts as GeoJsonObject}
        style={style}
        onEachFeature={onEachFeature}
      />

      {/* Regional boundaries overlay */}
      <RegionalBoundaries
        visible={true}
        color="#ffffff"
        weight={2}
        opacity={0.7}
      />

      {/* Lat/Lon grid overlay */}
      <GraticuleLayer visible={showGrid} />

      {/* City markers layer */}
      <CityMarkers visible={showCities} />

      {/* Climate story markers */}
      <ClimateStoryMarkers visible={showStories} />

      {/* Zoom controls - bottom left */}
      <MapZoomControls />
    </MapContainer>
  );
};

export default memo(GhanaMap);
