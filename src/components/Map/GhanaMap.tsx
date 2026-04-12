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
import { getColorScale, formatValue, formatChange, type ColorScaleType } from "../../utils/colorScales";
import {
  getCoastalContextLabel,
  getCoastalExposure,
  isSeaLevelRiskVariable,
  isSeaLevelVariable,
} from "../../utils/coastalExposure";

import ClimateStoryMarkers from "./ClimateStoryMarkers";
import InterpolatedLayer from "./InterpolatedLayer";
import RegionalBoundaries from "./RegionalBoundaries";
import WaterBodiesLayer from "./WaterBodiesLayer";
import MapZoomControls from "./MapZoomControls";
import CoastlineLayer from "./CoastlineLayer";
import GraticuleLayer from "./GraticuleLayer";
import type { DataPoint } from "../../utils/idwInterpolation";
import "leaflet/dist/leaflet.css";

interface GhanaMapProps {
  districts: DistrictFeatureCollection | undefined;
  climateData: ClimateValue[] | undefined;
  comparisonData: ClimateComparison[] | undefined;
  showChange: boolean;
  activeVariableId: string;
  colorScaleType: ColorScaleType;
  minValue: number;
  maxValue: number;
  selectedDistrictId: string | null;
  onDistrictClick: (districtId: string) => void;
  onDistrictHover: (districtId: string | null) => void;

  dataVersion?: string;
  showGrid?: boolean;
  showWater?: boolean;
  showStories?: boolean;
  unit?: string;
}

// Ghana center coordinates
const GHANA_CENTER: [number, number] = [7.9465, -1.0232];
const GHANA_ZOOM = 7;
const MOBILE_INITIAL_CENTER: [number, number] = [7.35, -1.05];
const MOBILE_INITIAL_ZOOM = 6.6;

// Map bounds for Ghana
const GHANA_BOUNDS: [[number, number], [number, number]] = [
  [4.5, -3.5],  // Southwest
  [12, 1.5],  // Northeast
];

// Desktop-only max bounds (generous padding so the map can be panned freely)
const DESKTOP_MAX_BOUNDS: [[number, number], [number, number]] = [
  [-2, -12],   // Southwest
  [18, 10],    // Northeast
];

type DisplayMode = "choropleth" | "interpolated";

const getDisplayMode = (): DisplayMode => {
  if (typeof window === "undefined") {
    return "choropleth";
  }

  const display = new URLSearchParams(window.location.search).get("display");
  return display === "interpolated" ? "interpolated" : "choropleth";
};

// Component to fit map to Ghana bounds
const FitBounds = () => {
  const map = useMap();
  useEffect(() => {
    const applyBounds = () => {
      map.invalidateSize();

      const isMobile = window.innerWidth <= 768;
      if (isMobile) {
        map.setView(MOBILE_INITIAL_CENTER, MOBILE_INITIAL_ZOOM, { animate: false });
        return;
      }

      map.fitBounds(GHANA_BOUNDS, {
        paddingTopLeft: [20, 10],
        paddingBottomRight: [20, 150],
      });
      map.setMaxBounds(DESKTOP_MAX_BOUNDS);
    };

    applyBounds();
    const timer = window.setTimeout(applyBounds, 180);
    const settleTimer = window.setTimeout(applyBounds, 420);
    window.addEventListener("resize", applyBounds);

    return () => {
      window.clearTimeout(timer);
      window.clearTimeout(settleTimer);
      window.removeEventListener("resize", applyBounds);
    };
  }, [map]);
  return null;
};

const GhanaMap: React.FC<GhanaMapProps> = ({
  districts,
  climateData,
  comparisonData,
  showChange,
  activeVariableId,
  colorScaleType,
  minValue,
  maxValue,
  selectedDistrictId,
  onDistrictClick,
  onDistrictHover,

  dataVersion,
  showGrid = false,
  showWater = true,
  showStories = false,
  unit = "",
}) => {
  const displayMode = getDisplayMode();

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
    if (!districts || displayMode !== "interpolated") return [];

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
  }, [displayMode, districts, valueMap]);

  // Get stable color scale function (only changes when scale type changes)
  const colorFn = useMemo(
    () => getColorScale(colorScaleType),
    [colorScaleType]
  );

  // Ref to track all GeoJSON layers by district ID for imperative style updates
  const layersRef = useRef<Map<string, L.Path>>(new Map());

  const isSeaLevel = isSeaLevelVariable(activeVariableId);

  const getStyle = useCallback((
    districtId: string,
    districtName: string,
    regionName: string,
    isSelected: boolean,
  ): PathOptions => {
    // Sea level coastline mode: all districts are plain gray, data shown on coastline overlay
    if (isSeaLevel) {
      return {
        fillColor: "#e5e7eb",
        fillOpacity: 0.5,
        weight: isSelected ? 2.2 : 0.8,
        color: isSelected ? "#0f172a" : "#94a3b8",
        opacity: isSelected ? 0.9 : 0.4,
      };
    }

    const isIndirectSeaRisk =
      isSeaLevelRiskVariable(activeVariableId) &&
      getCoastalExposure(districtName, regionName).kind === "indirect";
    const value = valueMap.get(districtId);
    const hasValue = value !== undefined;
    const fillColor = hasValue
      ? colorFn(value, minValue, maxValue)
      : (isIndirectSeaRisk ? "rgba(8, 47, 73, 0.55)" : "#e5e7eb");
    const fillOpacity = displayMode === "interpolated"
      ? (isIndirectSeaRisk ? 0.22 : 0)
      : (hasValue ? 0.86 : 0.5);

    return {
      fillColor,
      fillOpacity,
      weight: isSelected ? 2.2 : 0.8,
      color: isSelected ? "#0f172a" : "#475569",
      opacity: isSelected ? 0.95 : 0.6,
    };
  }, [activeVariableId, isSeaLevel, colorFn, displayMode, maxValue, minValue, valueMap]);

  const style = useCallback((feature: Feature | undefined): PathOptions => {
    if (!feature?.properties) {
      return { fillColor: "#e5e7eb", fillOpacity: 0.5, weight: 0.8, color: "#475569", opacity: 0.6 };
    }
    const districtId = feature.properties.id as string;
    const districtName = feature.properties.name as string;
    const regionName = feature.properties.region as string;
    return getStyle(districtId, districtName, regionName, districtId === selectedDistrictId);
  }, [selectedDistrictId, getStyle]);

  // Imperatively update styles when selectedDistrictId changes (no GeoJSON re-mount)
  const prevSelectedRef = useRef<string | null>(null);
  useEffect(() => {
    const prev = prevSelectedRef.current;
    const curr = selectedDistrictId;
    prevSelectedRef.current = curr;

    // Deselect previous
    if (prev && layersRef.current.has(prev)) {
      const layer = layersRef.current.get(prev)! as L.Path & { feature?: Feature };
      const feature = layer.feature;
      if (feature?.properties) {
        layer.setStyle(getStyle(
          feature.properties.id as string,
          feature.properties.name as string,
          feature.properties.region as string,
          false
        ));
      }
    }
    // Select current
    if (curr && layersRef.current.has(curr)) {
      const layer = layersRef.current.get(curr)! as L.Path & { feature?: Feature };
      const feature = layer.feature;
      if (feature?.properties) {
        layer.setStyle(getStyle(
          feature.properties.id as string,
          feature.properties.name as string,
          feature.properties.region as string,
          true
        ));
      }
    }
  }, [selectedDistrictId, getStyle]);

  // Imperatively update tooltips when valueMap changes (climate data may arrive after GeoJSON mount)
  useEffect(() => {
    layersRef.current.forEach((layer, districtId) => {
      const typedLayer = layer as L.Path & { feature?: Feature };
      const props = typedLayer.feature?.properties;
      if (!props) return;

      const value = valueMap.get(districtId);
      const coastalContext = getCoastalContextLabel(activeVariableId, props.name as string, props.region as string);
      const formattedValue = value !== undefined
        ? (showChange ? formatChange(value, unit) : formatValue(value, unit))
        : "No data";
      const tooltipContent = `
        <strong>${props.name}</strong><br/>
        ${props.region}<br/>
        ${coastalContext ? `${coastalContext}<br/>` : ""}
        ${formattedValue}
      `;
      (layer as L.Layer).unbindTooltip();
      (layer as L.Layer).bindTooltip(tooltipContent, { sticky: true });
    });
  }, [valueMap, activeVariableId, showChange, unit]);

  // Event handlers for each feature
  const onEachFeature = useCallback((feature: Feature, layer: Layer) => {
    const districtId = feature.properties?.id as string;
    const districtName = feature.properties?.name as string;
    const region = feature.properties?.region as string;

    // Store reference for imperative updates
    layersRef.current.set(districtId, layer as L.Path);

    // Tooltip - will be updated when valueMap changes via useEffect
    const value = valueMap.get(districtId);
    const coastalContext = getCoastalContextLabel(activeVariableId, districtName, region);
    const formattedValue = value !== undefined
      ? (showChange ? formatChange(value, unit) : formatValue(value, unit))
      : "No data";
    const tooltipContent = `
      <strong>${districtName}</strong><br/>
      ${region}<br/>
      ${coastalContext ? `${coastalContext}<br/>` : ""}
      ${formattedValue}
    `;
    layer.bindTooltip(tooltipContent, { sticky: true });

    // Events
    layer.on({
      click: () => onDistrictClick(districtId),
      mouseover: () => onDistrictHover(districtId),
      mouseout: () => onDistrictHover(null),
    });
  }, [activeVariableId, valueMap, showChange, unit, onDistrictClick, onDistrictHover]);

  if (!districts) {
    return null;
  }

  return (
    <MapContainer
      center={GHANA_CENTER}
      zoom={GHANA_ZOOM}
      className="ghana-map"
      zoomControl={false}
      scrollWheelZoom={true}
      maxBoundsViscosity={0.5}
      minZoom={6}
      zoomSnap={0.5}
    >
      <FitBounds />

      {/* Light tile layer */}
      <TileLayer
        attribution='&copy; <a href="https://carto.com/">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
      />

      {/* Fallback display mode: centroid-based interpolation */}
      {displayMode === "interpolated" && dataPoints.length > 0 && (
        <InterpolatedLayer
          dataPoints={dataPoints}
          colorScale={colorFn}
          minValue={minValue}
          maxValue={maxValue}
          resolution={0.1}
          opacity={0.92}
          idwPower={2}
        />
      )}

      {/* District polygons colored by district-level climate values */}
      <GeoJSON
        key={dataVersion}
        data={districts as GeoJsonObject}
        style={style}
        onEachFeature={onEachFeature}
      />

      {/* Coastline overlay for sea level rise visualization */}
      {isSeaLevel && (
        <CoastlineLayer
          visible={true}
          valueMap={valueMap}
          colorFn={colorFn}
          minValue={minValue}
          maxValue={maxValue}
          onDistrictClick={onDistrictClick}
          onDistrictHover={onDistrictHover}
          selectedDistrictId={selectedDistrictId}
          showChange={showChange}
          unit={unit}
          dataVersion={dataVersion}
        />
      )}

      {/* Water bodies layer */}
      <WaterBodiesLayer visible={showWater} activeVariableId={activeVariableId} />

      {/* Regional boundaries overlay */}
      <RegionalBoundaries
        visible={true}
        color="#64748b"
        weight={1.4}
        opacity={0.5}
      />

      {/* Lat/Lon grid overlay */}
      <GraticuleLayer visible={showGrid} />

      {/* Climate story markers */}
      <ClimateStoryMarkers visible={showStories} />

      {/* Zoom controls - bottom left */}
      <MapZoomControls />
    </MapContainer>
  );
};

export default memo(GhanaMap);
