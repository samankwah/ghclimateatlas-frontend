// Web Worker for IDW interpolation - runs expensive computation off the main thread

import {
  generateInterpolatedGrid,
  GHANA_BOUNDS,
  type DataPoint,
  type Polygon,
  type MultiPolygon,
  type GridResult,
} from "./idwInterpolation";

export interface ComputeMessage {
  type: "compute";
  id: number;
  dataPoints: DataPoint[];
  resolution: number;
  idwPower: number;
  ghanaBoundary: { type: string; coordinates: Polygon | MultiPolygon }[];
}

export interface ResultMessage {
  type: "result";
  id: number;
  gridResult: GridResult;
}

// Cache grid results so revisiting a variable is instant
const gridCache = new Map<string, GridResult>();
const MAX_CACHE_SIZE = 20;

function getCacheKey(
  dataPoints: DataPoint[],
  resolution: number,
  idwPower: number
): string {
  const n = dataPoints.length;
  if (n === 0) return "empty";
  // Fast fingerprint: count + sum + first/last values
  let sum = 0;
  for (let i = 0; i < n; i++) sum += dataPoints[i].value;
  return `${n}-${sum.toFixed(2)}-${dataPoints[0].value.toFixed(4)}-${dataPoints[n - 1].value.toFixed(4)}-${resolution}-${idwPower}`;
}

self.onmessage = (e: MessageEvent<ComputeMessage>) => {
  const { type, id, dataPoints, resolution, idwPower, ghanaBoundary } = e.data;

  if (type === "compute") {
    const cacheKey = getCacheKey(dataPoints, resolution, idwPower);

    let gridResult = gridCache.get(cacheKey);
    if (!gridResult) {
      gridResult = generateInterpolatedGrid(
        GHANA_BOUNDS,
        dataPoints,
        resolution,
        { power: idwPower },
        ghanaBoundary
      );
      gridCache.set(cacheKey, gridResult);

      // Evict oldest entry if cache is full
      if (gridCache.size > MAX_CACHE_SIZE) {
        const firstKey = gridCache.keys().next().value;
        if (firstKey) gridCache.delete(firstKey);
      }
    }

    const result: ResultMessage = { type: "result", id, gridResult };
    self.postMessage(result);
  }
};
