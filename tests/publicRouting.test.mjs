import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  anomalyFromReference,
  ATLAS_HISTORY_STATE_KEY,
  dashboardDistrictForParameter,
  dashboardDistrictOptions,
  DASHBOARD_TIME_SCALE_LABELS,
  DASHBOARD_VARIABLE_IDS,
  dashboardQueryString,
  dashboardSelectionFromVariable,
  dashboardSeriesCsv,
  dashboardTimeScaleOptions,
  dashboardVariableForSelection,
  filterDashboardSeries,
  caseStudyIdFromPathname,
  caseStudyPath,
  isKnownRoute,
  isRouteActive,
  isAtlasHistoryEntry,
  markAtlasHistoryEntry,
  migrateLegacyMapLocation,
  navigate,
  navigateBackFromMap,
  normalizeDashboardQuery,
  PUBLIC_ROUTE_PATHS,
} from "../src/utils/publicRouting.ts";
import { OBSERVED_CLIMATOLOGY } from "../src/data/observedClimatology.ts";

const readSource = (relativePath) => readFile(new URL(relativePath, import.meta.url), "utf8");

const districts = [
  { id: "GH-AHA-ASUNAFO" },
  { id: "GH-GRE-ACCRA" },
];
const variables = [
  { id: "annual_mean_temp" },
  { id: "annual_precipitation" },
  { id: "sea_level_rise" },
];

test("defines every public route and the lazy map route", async () => {
  assert.deepEqual(PUBLIC_ROUTE_PATHS, [
    "/",
    "/overview",
    "/dashboard",
    "/case-studies",
    "/documents",
    "/guide",
  ]);
  assert.equal(isKnownRoute("/map"), true);
  assert.equal(isKnownRoute("/case-studies/keta-coastal-erosion"), true);
  assert.equal(isKnownRoute("/missing"), false);
  assert.equal(caseStudyIdFromPathname("/case-studies/keta-coastal-erosion/"), "keta-coastal-erosion");
  assert.equal(caseStudyIdFromPathname("/case-studies"), null);
  assert.equal(caseStudyPath("keta coastal erosion"), "/case-studies/keta%20coastal%20erosion");

  const rootSource = await readSource("../src/RootApp.tsx");
  assert.match(rootSource, /lazy\(\(\) => import\("\.\/App"\)\)/);
  assert.match(rootSource, /location\.pathname === "\/map"/);
});

test("keeps deployed builds map-only until the public site is enabled", async () => {
  const [features, rootSource, devEnv, prodEnv] = await Promise.all([
    readSource("../src/config/features.ts"),
    readSource("../src/RootApp.tsx"),
    readSource("../.env.development"),
    readSource("../.env"),
  ]);

  // Off unless the build explicitly sets the flag to "true".
  assert.match(features, /PUBLIC_SITE_ENABLED = import\.meta\.env\.VITE_PUBLIC_SITE_ENABLED === "true"/);
  // While off, every path renders the map and is rewritten to /map.
  assert.match(rootSource, /const isMap = !PUBLIC_SITE_ENABLED \|\| location\.pathname === "\/map"/);
  assert.match(rootSource, /replaceCurrentHistoryUrl\(`\/map\$\{window\.location\.search\}\$\{window\.location\.hash\}`\)/);
  // Only the dev server turns it on; the committed .env read by production builds must not.
  assert.match(devEnv, /^VITE_PUBLIC_SITE_ENABLED=true$/m);
  assert.doesNotMatch(prodEnv, /^VITE_PUBLIC_SITE_ENABLED=/m);
});

test("matches active public navigation exactly", () => {
  assert.equal(isRouteActive("/dashboard", "/dashboard"), true);
  assert.equal(isRouteActive("/dashboard/", "/dashboard"), true);
  assert.equal(isRouteActive("/dashboard/details", "/dashboard"), false);
  assert.equal(isRouteActive("/case-studies/keta-coastal-erosion", "/case-studies"), true);
  assert.equal(isRouteActive("/", "/overview"), false);
});

test("marks internal Atlas destinations without discarding existing history state", () => {
  const state = markAtlasHistoryEntry({ scrollPosition: 480 });

  assert.deepEqual(state, {
    scrollPosition: 480,
    [ATLAS_HISTORY_STATE_KEY]: true,
  });
  assert.equal(isAtlasHistoryEntry(state), true);
  assert.equal(isAtlasHistoryEntry({}), false);
  assert.equal(isAtlasHistoryEntry(null), false);
});

test("uses browser back for internal map entries and replaces direct entries with overview", () => {
  const originalWindow = globalThis.window;
  const calls = [];
  const setWindow = (initialState) => {
    const history = {
      state: initialState,
      back() {
        calls.push(["back"]);
      },
      pushState(state, _title, url) {
        this.state = state;
        calls.push(["push", url, state]);
      },
      replaceState(state, _title, url) {
        this.state = state;
        calls.push(["replace", url, state]);
      },
    };
    Object.defineProperty(globalThis, "window", {
      configurable: true,
      writable: true,
      value: {
        location: { href: "https://atlas.test/map?period=2080" },
        history,
        dispatchEvent(event) {
          calls.push(["event", event.type]);
          return true;
        },
      },
    });
    return history;
  };

  try {
    setWindow(markAtlasHistoryEntry());
    navigateBackFromMap();
    assert.deepEqual(calls, [["back"]]);

    calls.length = 0;
    const directHistory = setWindow({ mapDisplay: "choropleth" });
    navigateBackFromMap();
    assert.equal(calls[0][0], "replace");
    assert.equal(calls[0][1], "/overview");
    assert.equal(calls[0][2].mapDisplay, "choropleth");
    assert.equal(isAtlasHistoryEntry(directHistory.state), true);
    assert.deepEqual(calls[1], ["event", "atlas:navigation"]);

    calls.length = 0;
    const internalHistory = setWindow(null);
    navigate("/map?tour=1");
    assert.equal(calls[0][0], "push");
    assert.equal(calls[0][1], "/map?tour=1");
    assert.equal(isAtlasHistoryEntry(internalHistory.state), true);
  } finally {
    if (originalWindow === undefined) {
      delete globalThis.window;
    } else {
      globalThis.window = originalWindow;
    }
  }
});

test("migrates legacy root map links and preserves the complete map contract", () => {
  const migrated = migrateLegacyMapLocation(
    "/",
    "?scenario=rcp85&variable=annual_mean_temp&period=2080&district=GH-GRE-ACCRA&change=1&display=interpolated&unrelated=drop",
    "#legend",
  );

  assert.equal(
    migrated,
    "/map?variable=annual_mean_temp&period=2080&scenario=rcp85&district=GH-GRE-ACCRA&change=1&display=interpolated#legend",
  );
  assert.equal(migrateLegacyMapLocation("/", "?campaign=atlas"), null);
  assert.equal(migrateLegacyMapLocation("/overview", "?variable=annual_mean_temp"), null);
});

test("normalizes invalid dashboard parameters to safe defaults", () => {
  const state = normalizeDashboardQuery(
    "?district=unknown&variable=unknown&scenario=bad&from=2101&to=tomorrow",
    districts,
    variables,
  );

  assert.deepEqual(state, {
    district: "GH-GRE-ACCRA",
    variable: "annual_mean_temp",
    scenario: "rcp45",
    from: 1991,
    to: 2100,
  });
  assert.equal(
    dashboardQueryString(state),
    "district=GH-GRE-ACCRA&variable=annual_mean_temp&scenario=rcp45&from=1991&to=2100",
  );
});

test("maps public parameter and time-scale controls to API variables", () => {
  assert.equal(dashboardVariableForSelection("temperature", "annual"), "annual_mean_temp");
  assert.equal(dashboardVariableForSelection("temperature", "djf"), "mean_temp_dry_season");
  assert.equal(dashboardVariableForSelection("rainfall", "jas"), "precipitation_jul_aug_sep");
  assert.equal(dashboardVariableForSelection("sea-level", "son"), "sea_level_rise");
  assert.deepEqual(dashboardSelectionFromVariable("precipitation_apr_may_jun"), {
    parameter: "rainfall",
    timeScale: "amj",
  });
  assert.deepEqual(dashboardTimeScaleOptions("sea-level"), ["annual"]);
  assert.equal(DASHBOARD_TIME_SCALE_LABELS.jas, "Jul–Sep");
  assert.ok(DASHBOARD_VARIABLE_IDS.includes("sea_level_rise"));
});

test("limits sea-level dashboard selection to districts with coastal data", () => {
  const dashboardDistricts = [
    { id: "GH-EAS-ABUAK_2", name: "Abuakwa South" },
    { id: "GH-GRE-ACCRA", name: "Accra" },
    { id: "GH-GRE-ADA_E", name: "Ada East" },
  ];
  const seaLevelIds = new Set(["GH-GRE-ACCRA", "GH-GRE-ADA_E"]);
  const coastalDistricts = dashboardDistrictOptions(dashboardDistricts, "sea-level", seaLevelIds);

  assert.deepEqual(coastalDistricts.map(({ id }) => id), ["GH-GRE-ACCRA", "GH-GRE-ADA_E"]);
  assert.equal(dashboardDistrictOptions(dashboardDistricts, "sea-level", null).length, 0);
  assert.equal(dashboardDistrictOptions(dashboardDistricts, "temperature", null), dashboardDistricts);
  assert.equal(
    dashboardDistrictForParameter("GH-EAS-ABUAK_2", "sea-level", coastalDistricts),
    "GH-GRE-ACCRA",
  );
  assert.equal(
    dashboardDistrictForParameter("GH-GRE-ADA_E", "sea-level", coastalDistricts),
    "GH-GRE-ADA_E",
  );
});

test("rejects valid API indicators that are outside the focused public dashboard", () => {
  const state = normalizeDashboardQuery(
    "?district=GH-GRE-ACCRA&variable=heat_wave_count&scenario=rcp85&from=2000&to=2040",
    districts,
    [...variables, { id: "heat_wave_count" }],
  );
  assert.equal(state.variable, "annual_mean_temp");
  assert.equal(state.scenario, "rcp85");
});

test("normalizes reversed years and maps equivalent sea-level scenarios", () => {
  const state = normalizeDashboardQuery(
    "?district=GH-AHA-ASUNAFO&variable=sea_level_rise&scenario=rcp85&from=2080&to=2030",
    districts,
    variables,
  );

  assert.equal(state.district, "GH-AHA-ASUNAFO");
  assert.equal(state.variable, "sea_level_rise");
  assert.equal(state.scenario, "ssp585");
  assert.equal(state.from, 2030);
  assert.equal(state.to, 2080);
});

test("filters yearly data and calculates anomalies from the API reference mean", () => {
  const data = [
    { year: 1991, p10: 26, p50: 27, p90: 28 },
    { year: 1992, p10: 27, p50: 28, p90: 29 },
    { year: 1993, p10: 28, p50: 29, p90: 30 },
  ];
  const filtered = filterDashboardSeries(data, 1992, 1993);
  assert.equal(filtered.length, 2);
  assert.deepEqual(anomalyFromReference(filtered, 27), [
    { year: 1992, p10: 0, p50: 1, p90: 2 },
    { year: 1993, p10: 1, p50: 2, p90: 3 },
  ]);
});

test("creates a spreadsheet-safe CSV export for the visible dashboard series", () => {
  const csv = dashboardSeriesCsv(
    [{ year: 2030, p10: 26.1, p50: 27.2, p90: 28.4 }],
    { district: "Accra, Metropolitan", variable: "Average Temperature", scenario: "RCP4.5", unit: "°C" },
  );
  assert.match(csv, /District,"Accra, Metropolitan"/);
  assert.match(csv, /Year,p10,p50,p90\r\n2030,26\.1,27\.2,28\.4/);
});

test("keeps dashboard controls, data states, compact actions, and shared series query explicit", async () => {
  const [dashboardSource, seriesHookSource, rootSource, mapAppSource] = await Promise.all([
    readSource("../src/components/PublicSite/DashboardPage.tsx"),
    readSource("../src/hooks/useDistrictChartSeries.ts"),
    readSource("../src/RootApp.tsx"),
    readSource("../src/App.tsx"),
  ]);
  assert.match(dashboardSource, /Loading district climate projections/);
  assert.match(dashboardSource, /We couldn’t load the dashboard controls/);
  assert.match(dashboardSource, /Projection data is temporarily unavailable/);
  assert.match(dashboardSource, /No yearly values in this range/);
  assert.match(dashboardSource, /aria-label="Parameter"/);
  assert.match(dashboardSource, /aria-label="Time Scale"/);
  assert.match(dashboardSource, /<legend>Date Range<\/legend>/);
  assert.match(dashboardSource, /aria-label="District"/);
  assert.match(dashboardSource, /"Coastal District"/);
  assert.match(dashboardSource, /seaLevelAvailabilityQuery\.refetch\(\)/);
  assert.match(dashboardSource, /aria-label="Emissions Scenario"/);
  assert.match(dashboardSource, /district: event\.target\.value/);
  assert.match(dashboardSource, /scenario: event\.target\.value as Scenario/);
  assert.match(dashboardSource, /useDistrictChartSeries\(/);
  assert.match(dashboardSource, /seriesQuery\.refetch\(\)/);
  // CSV download was removed from the dashboard.
  assert.doesNotMatch(dashboardSource, /new Blob\(\[csv\]|Download CSV/);
  assert.match(dashboardSource, /View on map/);
  assert.doesNotMatch(dashboardSource, /dashboard-stat-grid/);
  assert.doesNotMatch(dashboardSource, /advanced-controls/);

  assert.match(seriesHookSource, /districtChartSeriesQueryKey/);
  assert.match(seriesHookSource, /\["district-chart-series", districtId, variable, scenario\]/);
  assert.match(seriesHookSource, /isSuccess: query\.isSuccess/);
  assert.match(seriesHookSource, /isError: query\.isError/);
  assert.match(seriesHookSource, /refetch: query\.refetch/);
  assert.match(rootSource, /<QueryClientProvider client=\{queryClient\}>/);
  assert.doesNotMatch(mapAppSource, /QueryClientProvider/);
});

test("ships typed observed climatology and Highcharts instead of a raster chart", async () => {
  assert.equal(OBSERVED_CLIMATOLOGY.north.length, 12);
  assert.equal(OBSERVED_CLIMATOLOGY.south.length, 12);
  assert.deepEqual(OBSERVED_CLIMATOLOGY.north[0], {
    region: "Northern Ghana",
    month: "Jan",
    rainfallMillimetres: 3,
    temperatureCelsius: 27.3,
  });

  const [pagesSource, observedChartSource, dashboardChartSource] = await Promise.all([
    readSource("../src/components/PublicSite/PublicPages.tsx"),
    readSource("../src/components/PublicSite/ObservedClimatologyChart.tsx"),
    readSource("../src/components/PublicSite/DashboardChart.tsx"),
  ]);
  assert.doesNotMatch(pagesSource, /observed-climate-ghana\.png/);
  assert.match(observedChartSource, /HighchartsReact/);
  assert.match(observedChartSource, /type: "column"/);
  assert.match(observedChartSource, /type: "spline"/);
  assert.match(observedChartSource, /yAxis: 1/);
  assert.match(dashboardChartSource, /type: "arearange"/);
  assert.match(dashboardChartSource, /type: "line"/);
  assert.match(dashboardChartSource, /crosshair/);
  assert.match(dashboardChartSource, /align: "right"/);
  assert.match(dashboardChartSource, /verticalAlign: "top"/);
  assert.doesNotMatch(dashboardChartSource, /View chart data/);
  assert.doesNotMatch(dashboardChartSource, /<img/);
});

test("uses keyboard-native FAQ disclosure controls and secure external links", async () => {
  const pagesSource = await readSource("../src/components/PublicSite/PublicPages.tsx");
  assert.match(pagesSource, /className="faq-category"/);
  assert.match(pagesSource, /className="faq-question"/);
  assert.match(pagesSource, /<summary>/);
  assert.doesNotMatch(pagesSource, /onKeyDown/);
  for (const match of pagesSource.matchAll(/target="_blank"([^>]+)>/g)) {
    assert.match(match[1], /rel="noopener noreferrer"/);
  }
});

test("keeps map sharing and guided-tour URLs state-safe", async () => {
  const [mapControls, shareDropdown, appSource, guideSource] = await Promise.all([
    readSource("../src/hooks/useMapControls.ts"),
    readSource("../src/components/Header/ShareDropdown.tsx"),
    readSource("../src/App.tsx"),
    readSource("../src/components/PublicSite/GuidePage.tsx"),
  ]);

  assert.match(mapControls, /window\.location\.pathname/);
  assert.match(mapControls, /params\.set\("display", display\)/);
  assert.match(shareDropdown, /navigator\.clipboard\.writeText\(window\.location\.href\)/);
  assert.match(guideSource, /to="\/map\?tour=1"/);
  assert.match(appSource, /params\.delete\("tour"\)/);
  assert.match(appSource, /replaceCurrentHistoryUrl\(nextUrl\)/);
  assert.match(mapControls, /replaceCurrentHistoryUrl\(nextUrl\)/);
  assert.doesNotMatch(appSource, /window\.history\.replaceState\(\{\}/);
  assert.doesNotMatch(mapControls, /window\.history\.replaceState\(\{\}/);
});

test("renders a high-contrast, keyboard-visible back control at every map header size", async () => {
  const [headerSource, appSource, css] = await Promise.all([
    readSource("../src/components/Header/Header.tsx"),
    readSource("../src/App.tsx"),
    readSource("../src/App.css"),
  ]);

  assert.equal(headerSource.match(/aria-label="Go back"/g)?.length, 2);
  assert.equal(headerSource.match(/title="Go back"/g)?.length, 2);
  assert.match(headerSource, /onClick=\{onNavigateBack\}/);
  // The back control only renders when the public site is enabled.
  assert.match(appSource, /onNavigateBack=\{PUBLIC_SITE_ENABLED \? handleNavigateBack : undefined\}/);
  assert.equal(headerSource.match(/\{onNavigateBack && \(/g)?.length, 2);
  assert.match(css, /\.map-back-button \{[\s\S]*?width: 44px;[\s\S]*?height: 44px;[\s\S]*?background: #ffc533;/);
  assert.match(css, /\.map-back-button:focus-visible \{[\s\S]*?outline: 3px solid #ffffff;/);
  assert.match(css, /grid-template-columns: 5\.75rem minmax\(0, 1fr\) 5\.75rem;/);
});
