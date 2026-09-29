import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const readSource = (relativePath) => readFile(new URL(relativePath, import.meta.url), "utf8");

test("hero photos ship as compressed WebP", async () => {
  const [pages, css] = await Promise.all([
    readSource("../src/components/PublicSite/PublicPages.tsx"),
    readSource("../src/components/PublicSite/public-site.css"),
  ]);

  assert.match(pages, /import heroImage from "\.\.\/\.\.\/assets\/gate-hero-storm-fields\.webp";/);
  assert.match(css, /url\("\.\.\/\.\.\/assets\/overview-hero-clouds\.webp"\)/);
});

test("Highcharts loads with the first chart, not with the site", async () => {
  const [pages, dashboard] = await Promise.all([
    readSource("../src/components/PublicSite/PublicPages.tsx"),
    readSource("../src/components/PublicSite/DashboardPage.tsx"),
  ]);

  assert.match(pages, /const ObservedClimatologyChart = lazy\(\(\) => import\("\.\/ObservedClimatologyChart"\)\);/);
  assert.match(dashboard, /const DashboardChart = lazy\(\(\) => import\("\.\/DashboardChart"\)\);/);
  assert.doesNotMatch(pages, /^import ObservedClimatologyChart/m);
  assert.doesNotMatch(dashboard, /^import DashboardChart/m);
  assert.match(dashboard, /<Suspense fallback=\{<ChartSkeleton height=\{360\} \/>\}>/);
});

test("the map library stays out of the public pages' bundle", async () => {
  const config = await readSource("../vite.config.ts");

  // Path-based chunking keeps React's entry in the vendor chunk.
  assert.match(config, /manualChunks\(id\) \{/);
  assert.match(config, /inPackage\('react', 'react-dom', 'scheduler'/);
  assert.match(config, /inPackage\('leaflet', 'react-leaflet', '@react-leaflet'\)\) return 'leaflet'/);
});

test("basemap hints are only added on the Map Viewer", async () => {
  const html = await readSource("../index.html");

  assert.match(html, /if \(!\/\^\\\/map\\\/\?\$\/\.test\(window\.location\.pathname\)\) return;/);
  assert.doesNotMatch(html, /<link rel="preload"[^>]*openfreemap/);
  assert.doesNotMatch(html, /<link rel="preconnect" href="https:\/\/tiles\.openfreemap\.org"/);
});

test("the dashboard dropdown uses the names-only district list", async () => {
  const dashboard = await readSource("../src/components/PublicSite/DashboardPage.tsx");

  assert.match(dashboard, /const districtsQuery = useDistrictList\(\);/);
  assert.doesNotMatch(dashboard, /useDistricts\b/);
});
