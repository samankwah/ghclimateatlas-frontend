import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { requestBrowserLocation } from "../src/utils/browserGeolocation.ts";
import {
  isPointInDistrictGeometry,
  resolveDistrictLocation,
} from "../src/utils/districtLocation.ts";

const polygon = (...rings) => ({ type: "Polygon", coordinates: rings });
const multiPolygon = (...polygons) => ({ type: "MultiPolygon", coordinates: polygons });
const square = (minX, minY, maxX, maxY) => [
  [minX, minY],
  [maxX, minY],
  [maxX, maxY],
  [minX, maxY],
  [minX, minY],
];
const district = ({
  id,
  name = id,
  region = "Test Region",
  centroid,
  geometry,
}) => ({
  type: "Feature",
  properties: { id, name, region, ...(centroid ? { centroid } : {}) },
  geometry,
});
const collection = (...features) => ({ type: "FeatureCollection", features });

test("detects points inside Polygon districts", () => {
  const geometry = polygon(square(0, 0, 4, 4));
  assert.equal(isPointInDistrictGeometry([2, 2], geometry), true);
  assert.equal(isPointInDistrictGeometry([5, 2], geometry), false);

  const result = resolveDistrictLocation(
    [2, 2],
    collection(district({ id: "polygon", centroid: [2, 2], geometry })),
  );
  assert.equal(result?.district.properties.id, "polygon");
  assert.equal(result?.kind, "exact");
});

test("detects points in every part of a MultiPolygon", () => {
  const geometry = multiPolygon(
    [square(0, 0, 2, 2)],
    [square(10, 10, 12, 12)],
  );
  assert.equal(isPointInDistrictGeometry([1, 1], geometry), true);
  assert.equal(isPointInDistrictGeometry([11, 11], geometry), true);
  assert.equal(isPointInDistrictGeometry([5, 5], geometry), false);
});

test("excludes polygon holes while treating boundary points as contained", () => {
  const geometry = polygon(square(0, 0, 10, 10), square(4, 4, 6, 6));
  assert.equal(isPointInDistrictGeometry([5, 5], geometry), false);
  assert.equal(isPointInDistrictGeometry([0, 5], geometry), true);
  assert.equal(isPointInDistrictGeometry([4, 5], geometry), true);
  assert.equal(isPointInDistrictGeometry([0, 0], geometry), true);
});

test("returns the nearest representative centroid for a point outside Ghana", () => {
  const result = resolveDistrictLocation(
    [-0.13, 51.51],
    collection(
      district({ id: "accra", name: "Accra Metropolitan", region: "Greater Accra", centroid: [-0.2, 5.56], geometry: null }),
      district({ id: "tamale", name: "Tamale Metropolitan", region: "Northern", centroid: [-0.84, 9.4], geometry: null }),
    ),
  );

  assert.equal(result?.kind, "nearest");
  assert.equal(result?.district.properties.id, "tamale");
  assert.deepEqual(result?.districtPosition, [-0.84, 9.4]);
  assert.ok(result && result.distanceKm > 4000);
});

test("handles missing geometry, missing centroids, and empty collections", () => {
  const missingGeometry = district({ id: "near", centroid: [1, 1], geometry: null });
  const missingCentroid = district({ id: "skip", geometry: null });

  assert.equal(isPointInDistrictGeometry([1, 1], null), false);
  assert.equal(
    resolveDistrictLocation([1.1, 1.1], collection(missingGeometry, missingCentroid))?.district.properties.id,
    "near",
  );
  assert.equal(resolveDistrictLocation([1, 1], collection(missingCentroid)), null);
  assert.equal(resolveDistrictLocation([1, 1], collection()), null);
});

const mockGeolocation = (run) => ({
  getCurrentPosition(success, error, options) {
    run({ success, error, options });
  },
});

test("requests browser location only through an explicit call and returns coordinates", async () => {
  let calls = 0;
  const geolocation = mockGeolocation(({ success, options }) => {
    calls += 1;
    assert.deepEqual(options, { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 });
    success({ coords: { latitude: 5.56, longitude: -0.2 } });
  });

  assert.equal(calls, 0);
  assert.deepEqual(await requestBrowserLocation(geolocation), {
    ok: true,
    latitude: 5.56,
    longitude: -0.2,
  });
  assert.equal(calls, 1);
});

test("maps unsupported, denied, unavailable, and timed-out geolocation states", async () => {
  assert.deepEqual(await requestBrowserLocation(undefined), { ok: false, reason: "unsupported" });

  for (const [code, reason] of [[1, "permission-denied"], [2, "unavailable"], [3, "timeout"]]) {
    const result = await requestBrowserLocation(mockGeolocation(({ error }) => error({ code })));
    assert.deepEqual(result, { ok: false, reason });
  }
});

test("treats malformed positions and synchronous browser errors as unavailable", async () => {
  const malformed = mockGeolocation(({ success }) => {
    success({ coords: { latitude: Number.NaN, longitude: -0.2 } });
  });
  const throwing = mockGeolocation(() => {
    throw new Error("blocked");
  });

  assert.deepEqual(await requestBrowserLocation(malformed), { ok: false, reason: "unavailable" });
  assert.deepEqual(await requestBrowserLocation(throwing), { ok: false, reason: "unavailable" });
});

test("routes a resolved district through the existing selection and URL flow", async () => {
  const [mapControls, ghanaMap, app, stateHook] = await Promise.all([
    readFile(new URL("../src/components/Map/MapZoomControls.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/components/Map/GhanaMap.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/App.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/hooks/useMapControls.ts", import.meta.url), "utf8"),
  ]);

  assert.match(mapControls, /onDistrictSelect\(district\.properties\.id\)/);
  assert.match(ghanaMap, /onDistrictSelect=\{onDistrictClick\}/);
  assert.match(app, /onDistrictClick=\{selectDistrict\}/);
  assert.match(app, /\{selectedDistrictId &&/);
  assert.match(stateHook, /params\.set\("district", state\.selectedDistrictId\)/);
});
