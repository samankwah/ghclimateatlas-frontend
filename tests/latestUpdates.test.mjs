import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const readSource = (relativePath) => readFile(new URL(relativePath, import.meta.url), "utf8");

const CARD = "../src/components/PublicSite/LatestUpdatesCard.tsx";
const HOOK = "../src/hooks/useLatestUpdates.ts";
const API = "../src/api/news.ts";
const PAGES = "../src/components/PublicSite/PublicPages.tsx";
const CSS = "../src/components/PublicSite/public-site.css";
const SITE = "../src/components/PublicSite/PublicSite.tsx";
const FALLBACK = "../src/data/latestUpdatesFallback.ts";

test("the latest updates feed is fetched through the backend proxy", async () => {
  const api = await readSource(API);

  // meteo.gov.gh sends no CORS headers, so the browser must not call it directly.
  assert.match(api, /baseURL: API_BASE/);
  assert.match(api, /get<AtlasNewsFeed>\("\/news\/latest"/);
  assert.doesNotMatch(api, /meteo\.gov\.gh/);
});

test("the query refreshes often enough for a tab left open on the Overview page", async () => {
  const hook = await readSource(HOOK);

  assert.match(hook, /queryKey: \["atlas-news", limit\]/);
  assert.match(hook, /staleTime: 5 \* 60 \* 1000/);
  assert.match(hook, /refetchOnWindowFocus: true/);
  assert.match(hook, /refetchOnReconnect: true/);
  assert.match(hook, /refetchInterval: 10 \* 60 \* 1000/);
  // A backgrounded tab should cost nothing.
  assert.match(hook, /refetchIntervalInBackground: false/);
});

test("the carousel follows the APG carousel pattern", async () => {
  const card = await readSource(CARD);

  assert.match(card, /aria-roledescription="carousel"/);
  assert.match(card, /aria-roledescription="slide"/);
  assert.match(card, /role="group"/);
  assert.match(card, /aria-label=\{`\$\{index \+ 1\} of \$\{total\}`\}/);
  assert.match(card, /aria-controls="overview-updates-track"/);
  assert.match(card, /aria-label=\{`Show update \$\{index \+ 1\} of \$\{total\}`\}/);
  // Auto-rotation must not announce; only a paused carousel speaks.
  assert.match(card, /aria-live=\{isPaused \? "polite" : "off"\}/);
});

test("auto-advance pauses for engaged and motion-sensitive readers", async () => {
  const card = await readSource(CARD);

  assert.match(card, /onMouseEnter=\{\(\) => setIsPaused\(true\)\}/);
  assert.match(card, /onMouseLeave=\{\(\) => setIsPaused\(false\)\}/);
  assert.match(card, /onFocus=\{\(\) => setIsPaused\(true\)\}/);
  assert.match(card, /prefers-reduced-motion: reduce/);
  assert.match(card, /if \(total < 2 \|\| isPaused \|\| prefersReducedMotion\(\)\) return;/);
  assert.match(card, /document\.visibilityState === "hidden"/);
});

test("the track is a scroll-snap viewport kept in step with the indicators", async () => {
  const card = await readSource(CARD);
  const css = await readSource(CSS);

  assert.match(card, /track\.scrollTo\(\{/);
  assert.match(card, /Math\.round\(track\.scrollLeft \/ track\.clientWidth\)/);
  assert.match(card, /addEventListener\("scroll", syncActiveIndex, \{ passive: true \}\)/);
  assert.match(css, /\.overview-updates-card__viewport \{[\s\S]*scroll-snap-type: x mandatory/);
  assert.match(css, /\.overview-updates-slide \{[\s\S]*scroll-snap-align: start/);
});

test("external GMet links are opened safely and images degrade gracefully", async () => {
  const card = await readSource(CARD);

  const externalLinks = card.match(/target="_blank"/g) ?? [];
  const safeRels = card.match(/rel="noopener noreferrer"/g) ?? [];
  assert.ok(externalLinks.length > 0);
  assert.equal(externalLinks.length, safeRels.length);

  // A failed rendition falls back to the original, then to the gradient alone.
  assert.match(card, /onError=\{handleImageError\}/);
  assert.match(card, /current !== item\.image_fallback_url \? item\.image_fallback_url : null/);
  assert.match(card, /loading=\{index === 0 \? "eager" : "lazy"\}/);
});

test("all four updates rotate in the carousel, with the next two as tiles beside it", async () => {
  const card = await readSource(CARD);
  const api = await readSource(API);

  assert.match(api, /export const LATEST_UPDATES_LIMIT = 4;/);
  assert.match(card, /items\.map\(\(item, index\) => \(\s*<UpdateSlide/);
  assert.match(card, /const TILE_COUNT = 2;/);
  // The tiles preview the updates after the one on show, wrapping round.
  assert.match(card, /items\[\(currentIndex \+ offset \+ 1\) % total\]/);
  assert.match(card, /<UpdateTile item=\{item\} key=\{item\.id\} source=\{GMET_SOURCE_LABEL\} \/>/);
  assert.doesNotMatch(card, /CAROUSEL_ONLY_IDS/);
  assert.doesNotMatch(card, /Explore case studies|More updates|overview-feature-footer/);
  // Every slide shares one layout: date and headline on top, publisher below.
  assert.match(card, /const UpdateStory = /);
  assert.match(card, /className="overview-update-story__source"/);
  // The reference layout has no header bar or arrow buttons on the lead tile.
  assert.doesNotMatch(card, /overview-updates-card__header/);
  assert.doesNotMatch(card, /aria-label="Next update"/);
});

test("degraded states are visible rather than disguised as live data", async () => {
  const card = await readSource(CARD);
  const fallback = await readSource(FALLBACK);

  assert.match(card, /LATEST_UPDATES_FALLBACK/);
  assert.match(card, /const isFallback = isError \|\| \(!isLoading && !data\);/);
  assert.match(card, /const leadSource = isFallback \? `\$\{GMET_SOURCE_LABEL\} · Saved copy` : GMET_SOURCE_LABEL;/);
  assert.match(card, /source=\{leadSource\}/);
  assert.match(card, /OverviewUpdatesSkeleton/);
  // Live news carries no "Updated ... ago" stamp.
  assert.doesNotMatch(card, /formatRelativeTime|Updated \$\{/);
  // The empty state points at the source instead of rendering a blank tile.
  assert.match(card, /Climate Atlas updates are published by the Ghana Meteorological Agency/);

  assert.match(fallback, /export const LATEST_UPDATES_FALLBACK: AtlasNewsItem\[\]/);
  assert.match(fallback, /https:\/\/www\.meteo\.gov\.gh\/news\//);
});

test("the Overview page swaps the prototype card for the updates carousel", async () => {
  const pages = await readSource(PAGES);
  const site = await readSource(SITE);

  assert.match(pages, /import LatestUpdatesCard from "\.\/LatestUpdatesCard";/);
  assert.match(pages, /<LatestUpdatesCard \/>/);
  assert.match(pages, /aria-labelledby="overview-feature-heading"/);
  assert.match(pages, /id="overview-feature-heading"/);
  // The retired stat cards are gone.
  assert.doesNotMatch(pages, /overview-quick-link-card/);

  // The retired prototype card and its Launch Map Viewer button are gone.
  assert.doesNotMatch(pages, /overview-launch-card/);
  assert.doesNotMatch(pages, /Track historical warming/);
  assert.doesNotMatch(pages, /overview-map-bar/);

  // The Map Viewer must still be reachable from the tab bar and the footer.
  assert.match(site, /<RouteLink className="atlas-tabs__map" to="\/map">Map Viewer<\/RouteLink>/);
  assert.match(site, /<RouteLink to="\/map">Map Viewer<\/RouteLink>/);
});

test("the carousel spans both rows with the tiles beside it, and responsive rules", async () => {
  const css = await readSource(CSS);

  assert.match(css, /\.overview-updates-card \{[\s\S]*grid-column: 1;[\s\S]*grid-row: 1 \/ span 2/);
  assert.match(css, /\.overview-update-tile \{[\s\S]*grid-column: 2;/);
  // The retired footer buttons left no rules behind.
  assert.doesNotMatch(css, /overview-feature-footer/);
  assert.match(css, /@media \(max-width: 860px\)[\s\S]*overview-updates-card \{[\s\S]*grid-column: 1 \/ -1/);
  assert.match(css, /@media \(max-width: 620px\)[\s\S]*overview-updates-card \{ min-height/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)[\s\S]*overview-updates-card__viewport \{ scroll-behavior: auto; \}/);

  // The whole slide is clickable through one focusable link.
  assert.match(css, /\.overview-updates-slide__link::after \{[\s\S]*inset: 0/);

  // Dead rules from the retired prototype card are gone.
  assert.doesNotMatch(css, /overview-launch-card/);
  assert.doesNotMatch(css, /launch-map-card/);
});
