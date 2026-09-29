import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const readSource = (relativePath) =>
  readFile(new URL(relativePath, import.meta.url), "utf8");

test("aligns Accra with its youth climate advocacy video", async () => {
  const storiesSource = await readSource("../src/data/climateStories.ts");
  const accraStory = storiesSource.match(
    /id: "accra-urban-heat",[\s\S]*?\n  },/,
  )?.[0];

  assert.ok(accraStory, "the existing Accra story should remain present");
  assert.match(accraStory, /title: "Climate Change Advocacy with Kids"/);
  assert.match(accraStory, /category: "Youth Climate Action"/);
  assert.match(accraStory, /videoUrl: "https:\/\/www\.dailymotion\.com\/video\/x8zk95s"/);
  assert.match(accraStory, /Chelsea Boakye/);
  assert.match(accraStory, /Nakeeyat/);
  assert.match(accraStory, /COP27/);
});

test("uses the West African extreme heat report for Tema", async () => {
  const storiesSource = await readSource("../src/data/climateStories.ts");
  const temaStory = storiesSource.match(
    /id: "tema-industrial-heat",[\s\S]*?\n  },/,
  )?.[0];

  assert.ok(temaStory, "the existing Tema story should remain present");
  assert.match(temaStory, /videoUrl: "https:\/\/www\.dailymotion\.com\/video\/x8x3gj4"/);
});

test("gives every current story a full-story destination", async () => {
  const storiesSource = await readSource("../src/data/climateStories.ts");
  const storyBlocks = [
    ...storiesSource.matchAll(
      /\r?\n  \{\r?\n    id: "([^"]+)",[\s\S]*?\r?\n  \},/g,
    ),
  ];

  assert.ok(storyBlocks.length > 0, "at least one climate story should be defined");
  for (const [storySource, storyId] of storyBlocks) {
    assert.match(
      storySource,
      /(?:externalUrl|videoUrl): "https?:\/\//,
      `${storyId} should have a dedicated page or original video URL`,
    );
  }
});

test("prefers dedicated story links and falls back to the original video page", async () => {
  const markersSource = await readSource(
    "../src/components/Map/ClimateStoryMarkers.tsx",
  );

  assert.match(
    markersSource,
    /const fullStoryUrl = activeStory\?\.externalUrl \|\| activeStory\?\.videoUrl/,
  );
  assert.match(markersSource, /\{fullStoryUrl && \([\s\S]*?href=\{fullStoryUrl\}/);
  assert.match(markersSource, /target="_blank"/);
  assert.match(markersSource, /rel="noopener noreferrer"/);
  assert.match(markersSource, /"Youth Climate Action": "#ec4899"/);
});

test("gives case-study cards two explicit actions without a hidden flip state", async () => {
  const [cardSource, pagesSource, publicSiteSource] = await Promise.all([
    readSource("../src/components/PublicSite/StoryCard.tsx"),
    readSource("../src/components/PublicSite/PublicPages.tsx"),
    readSource("../src/components/PublicSite/PublicSite.tsx"),
  ]);

  assert.match(cardSource, /className="story-card__media"/);
  assert.match(cardSource, />Watch video</);
  assert.match(cardSource, /className="story-card__details"/);
  assert.match(cardSource, />\s*View case study/);
  assert.match(cardSource, /to=\{caseStudyPath\(story\.id\)\}/);
  assert.doesNotMatch(cardSource, /isFlipped|rotateY|flip-control|story-card__back/);
  assert.match(pagesSource, /<ul className="story-card-grid"/);
  assert.match(publicSiteSource, /<CaseStudyDetailPage story=\{caseStudy\}/);
});

test("opens case-study videos in a native accessible modal", async () => {
  const modalSource = await readSource(
    "../src/components/PublicSite/StoryVideoModal.tsx",
  );

  assert.match(modalSource, /<dialog/);
  assert.match(modalSource, /aria-labelledby=/);
  assert.match(modalSource, /dialog\.showModal\(\)/);
  assert.match(modalSource, /onCancel=/);
  assert.match(modalSource, /autoPlay/);
  assert.match(modalSource, /controls/);
  assert.match(modalSource, /allowFullScreen/);
  assert.match(modalSource, /picture-in-picture/);
  assert.match(modalSource, /returnFocusTo/);
  assert.match(modalSource, /preventScroll: true/);
});
