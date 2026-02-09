// IDW (Inverse Distance Weighting) interpolation utility for climate data visualization

export interface DataPoint {
  lat: number;
  lon: number;
  value: number;
}

export interface InterpolationOptions {
  power?: number; // IDW power parameter (default: 2)
  maxDistance?: number; // Max search radius in degrees
  minPoints?: number; // Minimum nearby points to use
}

export interface GridResult {
  grid: number[][];
  mask: boolean[][]; // true if point is inside Ghana boundary
  bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
  resolution: number;
  rows: number;
  cols: number;
}

// GeoJSON types for boundary checking
export type Polygon = number[][][]; // Array of rings, each ring is array of [lon, lat] pairs
export type MultiPolygon = number[][][][]; // Array of polygons

/**
 * Ray-casting algorithm to check if a point is inside a polygon
 * @param lon - Longitude of the point
 * @param lat - Latitude of the point
 * @param polygon - Array of [lon, lat] coordinate pairs forming the polygon ring
 */
function pointInPolygonRing(lon: number, lat: number, ring: number[][]): boolean {
  let inside = false;
  const n = ring.length;

  for (let i = 0, j = n - 1; i < n; j = i++) {
    const xi = ring[i][0], yi = ring[i][1];
    const xj = ring[j][0], yj = ring[j][1];

    if (((yi > lat) !== (yj > lat)) &&
        (lon < (xj - xi) * (lat - yi) / (yj - yi) + xi)) {
      inside = !inside;
    }
  }

  return inside;
}

/**
 * Check if a point is inside a polygon (handles holes)
 */
function pointInPolygon(lon: number, lat: number, polygon: Polygon): boolean {
  // Check if inside outer ring
  if (!pointInPolygonRing(lon, lat, polygon[0])) {
    return false;
  }

  // Check if inside any hole (if there are holes)
  for (let i = 1; i < polygon.length; i++) {
    if (pointInPolygonRing(lon, lat, polygon[i])) {
      return false; // Point is in a hole
    }
  }

  return true;
}

/**
 * Check if a point is inside any of the Ghana region polygons
 */
export function pointInGhanaBoundary(
  lon: number,
  lat: number,
  ghanaBoundary: { type: string; coordinates: Polygon | MultiPolygon }[]
): boolean {
  for (const geometry of ghanaBoundary) {
    if (geometry.type === 'Polygon') {
      if (pointInPolygon(lon, lat, geometry.coordinates as Polygon)) {
        return true;
      }
    } else if (geometry.type === 'MultiPolygon') {
      const multiPolygon = geometry.coordinates as MultiPolygon;
      for (const polygon of multiPolygon) {
        if (pointInPolygon(lon, lat, polygon)) {
          return true;
        }
      }
    }
  }
  return false;
}

// Ghana geographic bounds
export const GHANA_BOUNDS = {
  north: 11.2,
  south: 4.74,
  east: 1.2,
  west: -3.3,
};

/**
 * Calculate the distance between two points in degrees
 * Using simple Euclidean distance (sufficient for small areas like Ghana)
 */
function distance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const dLat = lat2 - lat1;
  const dLon = lon2 - lon1;
  return Math.sqrt(dLat * dLat + dLon * dLon);
}

/**
 * Core IDW function - interpolate value at a single point
 */
export function idwInterpolate(
  targetLat: number,
  targetLon: number,
  dataPoints: DataPoint[],
  options: InterpolationOptions = {}
): number {
  const { power = 2, maxDistance = 10, minPoints = 1 } = options;

  if (dataPoints.length === 0) {
    return 0;
  }

  // Calculate distances and weights
  let weightedSum = 0;
  let weightSum = 0;
  let usedPoints = 0;

  for (const point of dataPoints) {
    const d = distance(targetLat, targetLon, point.lat, point.lon);

    // If we're very close to a data point, return its value directly
    if (d < 0.0001) {
      return point.value;
    }

    // Skip points beyond max distance
    if (maxDistance && d > maxDistance) {
      continue;
    }

    // Calculate weight as inverse of distance raised to power
    const weight = 1 / Math.pow(d, power);
    weightedSum += weight * point.value;
    weightSum += weight;
    usedPoints++;
  }

  // If not enough points found, use all points regardless of distance
  if (usedPoints < minPoints) {
    weightedSum = 0;
    weightSum = 0;

    for (const point of dataPoints) {
      const d = distance(targetLat, targetLon, point.lat, point.lon);
      if (d < 0.0001) {
        return point.value;
      }
      const weight = 1 / Math.pow(d, power);
      weightedSum += weight * point.value;
      weightSum += weight;
    }
  }

  return weightSum > 0 ? weightedSum / weightSum : 0;
}

/**
 * Generate interpolated grid for the entire bounds
 * Returns a 2D array of interpolated values and a mask for Ghana boundary
 */
export function generateInterpolatedGrid(
  bounds: { north: number; south: number; east: number; west: number },
  dataPoints: DataPoint[],
  resolution: number,
  options: InterpolationOptions = {},
  ghanaBoundary?: { type: string; coordinates: Polygon | MultiPolygon }[]
): GridResult {
  const cols = Math.ceil((bounds.east - bounds.west) / resolution);
  const rows = Math.ceil((bounds.north - bounds.south) / resolution);

  const grid: number[][] = [];
  const mask: boolean[][] = [];

  for (let row = 0; row < rows; row++) {
    const gridRow: number[] = [];
    const maskRow: boolean[] = [];
    const lat = bounds.north - row * resolution - resolution / 2;

    for (let col = 0; col < cols; col++) {
      const lon = bounds.west + col * resolution + resolution / 2;
      const value = idwInterpolate(lat, lon, dataPoints, options);
      gridRow.push(value);

      // Check if point is inside Ghana boundary
      if (ghanaBoundary) {
        maskRow.push(pointInGhanaBoundary(lon, lat, ghanaBoundary));
      } else {
        maskRow.push(true); // No boundary = show everything
      }
    }

    grid.push(gridRow);
    mask.push(maskRow);
  }

  return {
    grid,
    mask,
    bounds,
    resolution,
    rows,
    cols,
  };
}

/**
 * Convert a value to a color using a color scale function
 */
export function valueToColor(
  value: number,
  minValue: number,
  maxValue: number,
  colorScale: (value: number, min: number, max: number) => string
): string {
  // Clamp value to range
  const clampedValue = Math.max(minValue, Math.min(maxValue, value));
  return colorScale(clampedValue, minValue, maxValue);
}

/**
 * Parse CSS color string to RGBA values
 */
export function parseColor(color: string): [number, number, number, number] {
  // Handle rgb() format
  const rgbMatch = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
  if (rgbMatch) {
    return [
      parseInt(rgbMatch[1], 10),
      parseInt(rgbMatch[2], 10),
      parseInt(rgbMatch[3], 10),
      255,
    ];
  }

  // Handle rgba() format
  const rgbaMatch = color.match(/rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)/);
  if (rgbaMatch) {
    return [
      parseInt(rgbaMatch[1], 10),
      parseInt(rgbaMatch[2], 10),
      parseInt(rgbaMatch[3], 10),
      Math.round(parseFloat(rgbaMatch[4]) * 255),
    ];
  }

  // Handle hex format
  const hexMatch = color.match(/^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
  if (hexMatch) {
    return [
      parseInt(hexMatch[1], 16),
      parseInt(hexMatch[2], 16),
      parseInt(hexMatch[3], 16),
      255,
    ];
  }

  // Default to transparent
  return [0, 0, 0, 0];
}

/**
 * Create an ImageData from a grid of values
 * Uses the mask to only show pixels inside Ghana boundary
 */
export function gridToImageData(
  gridResult: GridResult,
  minValue: number,
  maxValue: number,
  colorScale: (value: number, min: number, max: number) => string,
  opacity: number = 0.8
): ImageData {
  const { grid, mask, rows, cols } = gridResult;
  const imageData = new ImageData(cols, rows);

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const pixelIndex = (row * cols + col) * 4;

      // Check if this pixel is inside Ghana boundary
      if (!mask[row][col]) {
        // Outside boundary - fully transparent
        imageData.data[pixelIndex] = 0;
        imageData.data[pixelIndex + 1] = 0;
        imageData.data[pixelIndex + 2] = 0;
        imageData.data[pixelIndex + 3] = 0;
        continue;
      }

      const value = grid[row][col];
      const color = valueToColor(value, minValue, maxValue, colorScale);
      const [r, g, b] = parseColor(color);

      imageData.data[pixelIndex] = r;
      imageData.data[pixelIndex + 1] = g;
      imageData.data[pixelIndex + 2] = b;
      imageData.data[pixelIndex + 3] = Math.round(opacity * 255);
    }
  }

  return imageData;
}
