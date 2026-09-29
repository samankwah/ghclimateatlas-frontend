import type {
  DistrictFeatureCollection,
  DistrictGeoJSON,
  DistrictGeometry,
  GeoJSONPosition,
} from "../types/climate";

type RingLocation = "outside" | "inside" | "boundary";

export interface DistrictLocationResolution {
  district: DistrictGeoJSON;
  kind: "exact" | "nearest";
  distanceKm: number;
  districtPosition: GeoJSONPosition;
}

const BOUNDARY_EPSILON = 1e-10;
const EARTH_RADIUS_KM = 6371.0088;

const isFinitePosition = (position: readonly number[] | undefined): position is GeoJSONPosition =>
  Boolean(
    position &&
    position.length >= 2 &&
    Number.isFinite(position[0]) &&
    Number.isFinite(position[1]),
  );

const isPointOnSegment = (
  point: GeoJSONPosition,
  start: GeoJSONPosition,
  end: GeoJSONPosition,
): boolean => {
  const [x, y] = point;
  const [x1, y1] = start;
  const [x2, y2] = end;
  const deltaX = x2 - x1;
  const deltaY = y2 - y1;
  const crossProduct = (x - x1) * deltaY - (y - y1) * deltaX;
  const scale = Math.max(1, Math.abs(deltaX), Math.abs(deltaY));

  if (Math.abs(crossProduct) > BOUNDARY_EPSILON * scale) {
    return false;
  }

  return (
    x >= Math.min(x1, x2) - BOUNDARY_EPSILON &&
    x <= Math.max(x1, x2) + BOUNDARY_EPSILON &&
    y >= Math.min(y1, y2) - BOUNDARY_EPSILON &&
    y <= Math.max(y1, y2) + BOUNDARY_EPSILON
  );
};

const locatePointInRing = (
  point: GeoJSONPosition,
  ring: GeoJSONPosition[],
): RingLocation => {
  if (ring.length < 3) {
    return "outside";
  }

  let inside = false;
  const [x, y] = point;

  for (let index = 0, previous = ring.length - 1; index < ring.length; previous = index++) {
    const start = ring[previous];
    const end = ring[index];

    if (!isFinitePosition(start) || !isFinitePosition(end)) {
      continue;
    }

    if (isPointOnSegment(point, start, end)) {
      return "boundary";
    }

    const [x1, y1] = start;
    const [x2, y2] = end;
    const crossesLatitude = (y1 > y) !== (y2 > y);
    const intersectionX = ((x2 - x1) * (y - y1)) / (y2 - y1) + x1;

    if (crossesLatitude && x < intersectionX) {
      inside = !inside;
    }
  }

  return inside ? "inside" : "outside";
};

const isPointInPolygon = (
  point: GeoJSONPosition,
  rings: GeoJSONPosition[][],
): boolean => {
  const exterior = rings[0];
  if (!exterior) {
    return false;
  }

  const exteriorLocation = locatePointInRing(point, exterior);
  if (exteriorLocation === "boundary") {
    return true;
  }
  if (exteriorLocation === "outside") {
    return false;
  }

  for (const hole of rings.slice(1)) {
    const holeLocation = locatePointInRing(point, hole);
    if (holeLocation === "boundary") {
      return true;
    }
    if (holeLocation === "inside") {
      return false;
    }
  }

  return true;
};

export const isPointInDistrictGeometry = (
  point: GeoJSONPosition,
  geometry: DistrictGeometry | null | undefined,
): boolean => {
  if (!isFinitePosition(point) || !geometry) {
    return false;
  }

  if (geometry.type === "Polygon") {
    return isPointInPolygon(point, geometry.coordinates);
  }

  return geometry.coordinates.some((polygon) => isPointInPolygon(point, polygon));
};

const distanceInKilometres = (from: GeoJSONPosition, to: GeoJSONPosition): number => {
  const toRadians = (degrees: number) => degrees * (Math.PI / 180);
  const latitudeDelta = toRadians(to[1] - from[1]);
  const longitudeDelta = toRadians(to[0] - from[0]);
  const fromLatitude = toRadians(from[1]);
  const toLatitude = toRadians(to[1]);
  const haversine =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(fromLatitude) * Math.cos(toLatitude) * Math.sin(longitudeDelta / 2) ** 2;

  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(haversine)));
};

export const resolveDistrictLocation = (
  position: GeoJSONPosition,
  districts: DistrictFeatureCollection | null | undefined,
): DistrictLocationResolution | null => {
  if (!isFinitePosition(position) || !districts?.features.length) {
    return null;
  }

  const containingDistrict = districts.features.find((district) =>
    isPointInDistrictGeometry(position, district.geometry),
  );

  if (containingDistrict) {
    const centroid = containingDistrict.properties.centroid;
    return {
      district: containingDistrict,
      kind: "exact",
      distanceKm: 0,
      districtPosition: isFinitePosition(centroid) ? centroid : position,
    };
  }

  let nearest: DistrictLocationResolution | null = null;
  for (const district of districts.features) {
    const centroid = district.properties.centroid;
    if (!isFinitePosition(centroid)) {
      continue;
    }

    const distanceKm = distanceInKilometres(position, centroid);
    if (!nearest || distanceKm < nearest.distanceKm) {
      nearest = {
        district,
        kind: "nearest",
        distanceKm,
        districtPosition: centroid,
      };
    }
  }

  return nearest;
};
