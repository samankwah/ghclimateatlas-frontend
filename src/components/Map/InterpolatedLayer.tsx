// Canvas overlay component for IDW-interpolated climate visualization
// Uses a Web Worker to prevent UI freezes during heavy computation

import { useEffect, useRef, useState, useMemo } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import {
  gridToImageData,
  GHANA_BOUNDS,
  type DataPoint,
  type GridResult,
  type Polygon,
  type MultiPolygon,
} from "../../utils/idwInterpolation";
import type { ComputeMessage, ResultMessage } from "../../utils/idwWorker";

interface InterpolatedLayerProps {
  dataPoints: DataPoint[];
  colorScale: (value: number, min: number, max: number) => string;
  minValue: number;
  maxValue: number;
  resolution?: number;
  opacity?: number;
  idwPower?: number;
}

type BoundaryGeom = { type: string; coordinates: Polygon | MultiPolygon };

// Lazy-load Ghana boundary from GeoJSON (loaded once, cached in module scope)
let boundaryPromise: Promise<BoundaryGeom[]> | null = null;
function loadGhanaBoundary(): Promise<BoundaryGeom[]> {
  if (!boundaryPromise) {
    boundaryPromise = import("../../assets/ghana_regions.geojson").then((mod) => {
      const raw = (mod.default ?? mod) as unknown as {
        features: Array<{ geometry: { type: string; coordinates: Polygon | MultiPolygon } }>;
      };
      return raw.features.map((f) => ({
        type: f.geometry.type,
        coordinates: f.geometry.coordinates,
      }));
    });
  }
  return boundaryPromise;
}

const InterpolatedLayer: React.FC<InterpolatedLayerProps> = ({
  dataPoints,
  colorScale,
  minValue,
  maxValue,
  resolution = 0.1, // Reduced from 0.05 for 4x performance boost
  opacity = 0.8,
  idwPower = 2,
}) => {
  const map = useMap();
  const imageOverlayRef = useRef<L.ImageOverlay | null>(null);
  const workerRef = useRef<Worker | null>(null);
  const requestIdRef = useRef(0);
  const [gridResult, setGridResult] = useState<GridResult | null>(null);
  const [ghanaBoundary, setGhanaBoundary] = useState<BoundaryGeom[] | null>(null);

  // Lazy-load Ghana boundary
  useEffect(() => {
    loadGhanaBoundary().then(setGhanaBoundary);
  }, []);

  // Initialize Web Worker
  useEffect(() => {
    workerRef.current = new Worker(
      new URL("../../utils/idwWorker.ts", import.meta.url),
      { type: "module" }
    );

    workerRef.current.onmessage = (e: MessageEvent<ResultMessage>) => {
      const { type, id, gridResult: result } = e.data;
      if (type === "result" && id === requestIdRef.current) {
        setGridResult(result);
      }
    };

    return () => {
      workerRef.current?.terminate();
      workerRef.current = null;
    };
  }, []);

  // Send computation request to worker when data changes
  useEffect(() => {
    if (dataPoints.length === 0 || !ghanaBoundary) {
      if (dataPoints.length === 0) setGridResult(null);
      return;
    }

    const id = ++requestIdRef.current;
    const message: ComputeMessage = {
      type: "compute",
      id,
      dataPoints,
      resolution,
      idwPower,
      ghanaBoundary,
    };
    workerRef.current?.postMessage(message);
  }, [dataPoints, resolution, idwPower, ghanaBoundary]);

  // Create the image data URL from the grid (cheap, runs on main thread)
  const imageDataUrl = useMemo(() => {
    if (!gridResult) return null;

    const canvas = document.createElement("canvas");
    canvas.width = gridResult.cols;
    canvas.height = gridResult.rows;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    const imageData = gridToImageData(
      gridResult,
      minValue,
      maxValue,
      colorScale,
      opacity
    );
    ctx.putImageData(imageData, 0, 0);
    return canvas.toDataURL();
  }, [gridResult, minValue, maxValue, colorScale, opacity]);

  // Create/update the image overlay on the map
  useEffect(() => {
    if (!imageDataUrl) {
      if (imageOverlayRef.current) {
        map.removeLayer(imageOverlayRef.current);
        imageOverlayRef.current = null;
      }
      return;
    }

    const bounds: L.LatLngBoundsExpression = [
      [GHANA_BOUNDS.south, GHANA_BOUNDS.west],
      [GHANA_BOUNDS.north, GHANA_BOUNDS.east],
    ];

    if (imageOverlayRef.current) {
      imageOverlayRef.current.setUrl(imageDataUrl);
    } else {
      imageOverlayRef.current = L.imageOverlay(imageDataUrl, bounds, {
        opacity: 1,
        interactive: false,
        zIndex: 200,
      });
      imageOverlayRef.current.addTo(map);
    }

    return () => {
      if (imageOverlayRef.current) {
        map.removeLayer(imageOverlayRef.current);
        imageOverlayRef.current = null;
      }
    };
  }, [map, imageDataUrl]);

  // Ensure overlay stays below district borders
  useEffect(() => {
    if (imageOverlayRef.current) {
      imageOverlayRef.current.bringToBack();
    }
  });

  return null;
};

export default InterpolatedLayer;
