import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const readSource = (relativePath) => readFile(new URL(relativePath, import.meta.url), "utf8");

test("installs and configures the shared React skeleton loader", async () => {
  const [packageJson, mainSource, skeletonSource] = await Promise.all([
    readSource("../package.json"),
    readSource("../src/main.tsx"),
    readSource("../src/components/Loading/SkeletonLoaders.tsx"),
  ]);

  assert.match(packageJson, /"react-loading-skeleton": "\^3\.5\.0"/);
  assert.match(mainSource, /react-loading-skeleton\/dist\/skeleton\.css/);
  assert.match(skeletonSource, /SkeletonTheme/);
  assert.match(skeletonSource, /baseColor=\{tone === "dark"/);
  assert.match(skeletonSource, /highlightColor=\{tone === "dark"/);
  assert.match(skeletonSource, /role="status"/);
  assert.match(skeletonSource, /aria-busy="true"/);
  assert.match(skeletonSource, /className="visually-hidden"/);
});

test("uses layout-matched skeletons on the main asynchronous surfaces", async () => {
  const [dashboardSource, districtPanelSource, storyCardSource, siteSource, skeletonSource] = await Promise.all([
    readSource("../src/components/PublicSite/DashboardPage.tsx"),
    readSource("../src/components/InfoPanel/DistrictDetailPanel.tsx"),
    readSource("../src/components/PublicSite/StoryCard.tsx"),
    readSource("../src/components/PublicSite/PublicSite.tsx"),
    readSource("../src/components/Loading/SkeletonLoaders.tsx"),
  ]);

  assert.match(dashboardSource, /<DashboardResultsSkeleton label="Loading district climate projections…"/);
  assert.match(districtPanelSource, /<DistrictChartSkeleton \/>/);
  assert.match(storyCardSource, /!mediaLoaded && <StoryMediaSkeleton \/>/);
  assert.match(storyCardSource, /onLoadedData=\{finishLoadingMedia\}/);
  assert.match(storyCardSource, /onLoad=\{finishLoadingMedia\}/);
  assert.match(siteSource, /<Suspense fallback=\{<DocumentsPageSkeleton \/>\}>/);
  assert.match(siteSource, /<Suspense fallback=\{<GuidePageSkeleton \/>\}>/);
  assert.match(skeletonSource, /dashboard-content-row dashboard-skeleton-row/);
  assert.match(skeletonSource, /dashboard-chart-card dashboard-skeleton-chart/);
  assert.match(skeletonSource, /className="document-result documents-skeleton-result"/);
  assert.match(skeletonSource, /className="guide-simple public-container guide-page-skeleton"/);
  assert.match(skeletonSource, /tone="dark"/);
});
