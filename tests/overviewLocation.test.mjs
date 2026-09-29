import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  normalizeOverviewQuery,
  overviewQueryString,
} from "../src/utils/publicRouting.ts";

const readSource = (relativePath) => readFile(new URL(relativePath, import.meta.url), "utf8");

const districts = [
  { id: "GH-GRE-ACCRA" },
  { id: "GH-NOR-TAMAL" },
  { id: "GH-GRE-ADA_E" },
];

test("resolves the overview district from the URL and falls back to Accra", () => {
  assert.equal(normalizeOverviewQuery("?district=GH-NOR-TAMAL", districts), "GH-NOR-TAMAL");
  assert.equal(normalizeOverviewQuery("?district=GH-NOWHERE", districts), "GH-GRE-ACCRA");
  assert.equal(normalizeOverviewQuery("", districts), "GH-GRE-ACCRA");
});

test("falls back to the first loaded district, then the default, before boundaries arrive", () => {
  assert.equal(normalizeOverviewQuery("?district=GH-NOR-TAMAL", []), "GH-GRE-ACCRA");
  assert.equal(
    normalizeOverviewQuery("?district=GH-NOR-TAMAL", [{ id: "GH-VOL-HO" }]),
    "GH-VOL-HO",
  );
});

test("round-trips a selection through the shareable overview URL", () => {
  const query = overviewQueryString("GH-GRE-ADA_E");
  assert.equal(query, "district=GH-GRE-ADA_E");
  assert.equal(normalizeOverviewQuery(`?${query}`, districts), "GH-GRE-ADA_E");
});

test("the overview locates silently, with no control on the page", async () => {
  const [hook, overview] = await Promise.all([
    readSource("../src/hooks/useOverviewAutoLocate.ts"),
    readSource("../src/components/PublicSite/PublicPages.tsx"),
  ]);

  assert.match(hook, /requestBrowserLocation\(geolocation\)/);
  assert.match(hook, /resolveDistrictLocation\(\[longitude, latitude\], featureCollection\)/);
  assert.match(hook, /navigate\(`\/overview\?\$\{overviewQueryString\(resolution\.district\.properties\.id\)\}`, \{ replace: true \}\)/);
  // The guess is headless: no markup, no status text, no picker.
  assert.doesNotMatch(hook, /className=/);
  // Nothing on the Overview page is district-specific any more, so it must not prompt for location.
  assert.doesNotMatch(overview, /useOverviewAutoLocate/);
});

test("the silent guess runs at most once and never over an explicit choice", async () => {
  const hook = await readSource("../src/hooks/useOverviewAutoLocate.ts");

  assert.match(hook, /if \(attemptedRef\.current \|\| hasExplicitDistrict \|\| !districtsReady\) return;/);
  // The marker is written before the request so a re-render cannot double-prompt.
  assert.match(hook, /if \(readAutoLocateMarker\(\)\) return;\s+writeAutoLocateMarker\(\);/);
  assert.match(hook, /if \(await geolocationPermissionDenied\(\)\) return;/);
  // Blocked storage must not throw, and must not re-prompt.
  assert.match(hook, /catch \{\s+return true;/);
  // Every failure leaves the Accra default in place, without an error banner.
  assert.match(hook, /if \(cancelled \|\| !browserLocation\.ok\) return;/);
  assert.match(hook, /if \(cancelled \|\| !resolution\) return;/);
});

test("the map keeps the only visible geolocation control", async () => {
  const [geolocation, mapControls] = await Promise.all([
    readSource("../src/utils/browserGeolocation.ts"),
    readSource("../src/components/Map/MapZoomControls.tsx"),
  ]);

  assert.match(geolocation, /export const GEOLOCATION_FAILURE_MESSAGES: Record<GeolocationFailureReason, string>/);
  assert.doesNotMatch(mapControls, /const FAILURE_MESSAGES/);
  assert.match(mapControls, /GEOLOCATION_FAILURE_MESSAGES\[browserLocation\.reason\]/);
});
