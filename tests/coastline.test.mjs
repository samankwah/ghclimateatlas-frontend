import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { COASTAL_DISTRICT_IDS } from "../src/data/coastalDistricts.ts";

const coastline = JSON.parse(
  readFileSync(new URL("../src/assets/ghana_coastline_segments.geojson", import.meta.url), "utf-8"),
);
const lines = coastline.features.map((feature) =>
  feature.geometry.type === "LineString" ? [feature.geometry.coordinates] : feature.geometry.coordinates,
);

test("coastline is one unbroken line from Cote d'Ivoire to Togo", () => {
  for (const featureLines of lines) {
    assert.equal(featureLines.length, 1, "each district's coast should be a single line");
  }
  for (let i = 1; i < lines.length; i += 1) {
    const previousEnd = lines[i - 1][0].at(-1);
    const nextStart = lines[i][0][0];
    assert.deepEqual(nextStart, previousEnd, `gap before ${coastline.features[i].properties.district_name}`);
  }
});

test("coastline stays on the coast and never follows the land borders", () => {
  const points = lines.flat(2);
  const lons = points.map(([lon]) => lon);
  const lats = points.map(([, lat]) => lat);
  // Coastal border points: Cote d'Ivoire ~(-3.10, 5.09), Togo ~(1.20, 6.11)
  assert.ok(Math.min(...lons) > -3.11);
  assert.ok(Math.max(...lons) < 1.21);
  assert.ok(Math.max(...lats) < 6.12, "line runs north along the Togo border");
  // West of Cape Coast the coast is below 5.12N; the Cote d'Ivoire border runs north of it
  assert.ok(points.filter(([lon]) => lon < -2.5).every(([, lat]) => lat < 5.1));
});

test("coastal district IDs match the coastline segments", () => {
  assert.deepEqual(
    coastline.features.map((feature) => feature.properties.district_id),
    [...COASTAL_DISTRICT_IDS],
  );
});
