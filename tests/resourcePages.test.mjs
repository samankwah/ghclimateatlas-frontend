import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  ATLAS_DOCUMENTS,
  documentCountForFilter,
  filterAtlasDocuments,
} from "../src/components/PublicSite/resourceContent.ts";

const readSource = (relativePath) => readFile(new URL(relativePath, import.meta.url), "utf8");

test("filters Atlas documents by type and meaningful metadata", () => {
  assert.equal(ATLAS_DOCUMENTS.length, 2);
  assert.equal(documentCountForFilter(ATLAS_DOCUMENTS, "all"), 2);
  assert.equal(documentCountForFilter(ATLAS_DOCUMENTS, "summary"), 1);
  assert.equal(documentCountForFilter(ATLAS_DOCUMENTS, "technical"), 1);
  assert.deepEqual(
    filterAtlasDocuments(ATLAS_DOCUMENTS, "methods", "all").map(({ id }) => id),
    ["atlas-technical-2026"],
  );
  assert.deepEqual(
    filterAtlasDocuments(ATLAS_DOCUMENTS, "planning", "summary").map(({ id }) => id),
    ["atlas-summary-2026"],
  );
  assert.equal(filterAtlasDocuments(ATLAS_DOCUMENTS, "methods", "summary").length, 0);
  assert.equal(filterAtlasDocuments(ATLAS_DOCUMENTS, "", "all").length, 2);
});

test("documents expose labeled search, pressed filters, result feedback, and recovery", async () => {
  const source = await readSource("../src/components/PublicSite/DocumentsPage.tsx");

  assert.match(source, /role="search"/);
  assert.match(source, /<label htmlFor="document-search">Search documents<\/label>/);
  assert.match(source, /type="search"/);
  assert.match(source, /aria-pressed=\{filter === option\.value\}/);
  assert.match(source, /aria-live="polite"/);
  assert.match(source, /No documents match your search/);
  assert.match(source, /Show all documents/);
  assert.match(source, /Open PDF/);
  assert.match(source, /opens in a new tab/);
  assert.match(source, /rel="noopener noreferrer"/);
  assert.doesNotMatch(source, /document-card__cover/);
  assert.match(source, /onOpenDataRequest/);
  assert.match(source, /<button className="text-link" type="button" onClick=\{onOpenDataRequest\}>/);
  assert.doesNotMatch(source, /meteo\.gov\.gh\/data-request/);
});

test("opens the shared Atlas data-request form from the public footer", async () => {
  const [siteSource, modalSource, apiSource, hookSource, modalCss] = await Promise.all([
    readSource("../src/components/PublicSite/PublicSite.tsx"),
    readSource("../src/components/Downloads/ClimateDataRequestModal.tsx"),
    readSource("../src/api/climate.ts"),
    readSource("../src/hooks/useClimateData.ts"),
    readSource("../src/components/Downloads/ClimateDataRequestModal.css"),
  ]);

  assert.match(siteSource, /useDistrictList\(dataRequestOpen\)/);
  assert.match(siteSource, /className="public-footer__link-button"[\s\S]*onClick=\{\(\) => setDataRequestOpen\(true\)\}/);
  assert.match(siteSource, /<ClimateDataRequestModal[\s\S]*open=\{dataRequestOpen\}/);
  assert.match(siteSource, /geographyOptionsLoading=\{districtListQuery\.isLoading\}/);
  assert.doesNotMatch(siteSource, /meteo\.gov\.gh\/data-request/);
  assert.match(apiSource, /api\.get<District\[]>\("\/districts\/list"\)/);
  assert.match(hookSource, /queryKey: \["district-list"\]/);
  assert.match(modalSource, /Loading region and district options/);
  assert.match(modalCss, /body\.public-route \.data-request-modal-overlay/);
  assert.match(modalCss, /@media \(max-width: 620px\)/);
});

test("guide stays concise while preserving a practical five-step workflow", async () => {
  const source = await readSource("../src/components/PublicSite/GuidePage.tsx");

  assert.match(source, /<nav className="guide-jump-links" aria-label="Guide sections">/);
  assert.match(source, /<ol className="guide-procedure">/);
  assert.equal(source.match(/title: "/g)?.length, 5);
  assert.match(source, /Choose a tool/);
  assert.match(source, /Use the map/);
  assert.match(source, /Read the results/);
  assert.match(source, /Open example/);
  assert.doesNotMatch(source, /IntersectionObserver/);
  assert.doesNotMatch(source, /guide-map-anatomy/);
  assert.doesNotMatch(source, /<details>/);
  assert.doesNotMatch(source, /guide-tour-card/);
});

test("resource routes keep route-specific Atlas hero highlights and remain responsive", async () => {
  const [siteSource, pagesSource, css] = await Promise.all([
    readSource("../src/components/PublicSite/PublicSite.tsx"),
    readSource("../src/components/PublicSite/PublicPages.tsx"),
    readSource("../src/components/PublicSite/public-site.css"),
  ]);

  assert.match(siteSource, /hasClimateHero \? \(/);
  assert.match(siteSource, /const routeHeroIndicators:/);
  assert.match(siteSource, /"\/dashboard": \{[\s\S]*title: "Climate Dashboard"/);
  assert.match(siteSource, /"\/documents": \[/);
  assert.match(siteSource, /title: "Official resources"/);
  assert.match(siteSource, /"\/guide": \[/);
  assert.match(siteSource, /title: "Choose a tool"/);
  assert.match(siteSource, /heroIndicators\.map/);
  assert.match(siteSource, /caseStudyHeroIndicators\(caseStudy\)/);
  assert.doesNotMatch(siteSource, /isResourcePage \? null/);
  assert.match(siteSource, /const DocumentsPage = lazy\(\(\) => import\("\.\/DocumentsPage"\)\)/);
  assert.match(siteSource, /<Suspense fallback=\{<DocumentsPageSkeleton \/>\}>/);
  assert.match(siteSource, /const GuidePage = lazy\(\(\) => import\("\.\/GuidePage"\)\)/);
  assert.match(siteSource, /<Suspense fallback=\{<GuidePageSkeleton \/>\}>/);
  assert.doesNotMatch(pagesSource, /export const DocumentsPage/);
  assert.doesNotMatch(pagesSource, /export const GuidePage/);
  assert.match(css, /\.document-result \{[\s\S]*grid-template-columns: 48px minmax\(0, 1fr\) 220px/);
  assert.match(css, /\.guide-simple \{[\s\S]*width: min\(900px/);
  assert.match(css, /\.guide-jump-links \{/);
  assert.match(css, /\.public-site--overview \.overview-indicators \{[\s\S]*grid-template-columns: repeat\(3, minmax\(0, 1fr\)\)/);
  assert.match(css, /@media \(max-width: 620px\)[\s\S]*\.public-site--overview \.overview-indicators \{[\s\S]*grid-template-columns: repeat\(2, minmax\(0, 1fr\)\)/);
  assert.match(css, /\.public-site--overview \.overview-indicators article:first-child \{ grid-column: 1 \/ -1; \}/);
  assert.match(css, /@media \(max-width: 620px\)[\s\S]*\.public-footer__grid \{[\s\S]*grid-template-columns: repeat\(2, minmax\(0, 1fr\)\)/);
  assert.match(css, /\.public-footer__grid > \.footer-brand,[\s\S]*\.public-footer__grid > \.footer-partnership \{ grid-column: 1 \/ -1; \}/);
  assert.match(css, /@media \(max-width: 620px\)[\s\S]*\.document-result \{[\s\S]*grid-template-columns: 40px minmax\(0, 1fr\)/);
});
