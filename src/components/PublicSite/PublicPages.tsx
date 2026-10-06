import { lazy, Suspense, useMemo, useRef, useState } from "react";
import heroImage from "../../assets/gate-hero-storm-fields.webp";
import logo from "../../assets/smart-logo-gmet.webp";
import { CLIMATE_STORIES } from "../../data/climateStories";
import { INDICATOR_SUMMARY, INDICATOR_SUMMARY_PERIODS } from "../../data/indicatorSummary";
import { OBSERVED_CLIMATOLOGY } from "../../data/observedClimatology";
import type { ClimateStory } from "../../types/story";
import { getHostedVideoThumbnail } from "../../utils/storyMedia";
import { ChartSkeleton } from "../Loading/SkeletonLoaders";
import AtlasIcon from "./AtlasIcon";
import LatestUpdatesCard from "./LatestUpdatesCard";
import RouteLink from "./RouteLink";
import StoryCard from "./StoryCard";
import StoryVideoModal from "./StoryVideoModal";

const STORIES_PER_PAGE = 6;

// Highcharts is heavy, so it loads with the Overview charts rather than with the site.
const ObservedClimatologyChart = lazy(() => import("./ObservedClimatologyChart"));

const climatologyChartFallback = (
  <figure className="climatology-chart"><ChartSkeleton height={340} /></figure>
);

export const HomePage = () => (
  <main id="main-content" className="home-page">
    <section className="home-hero" style={{ backgroundImage: `url(${heroImage})` }}>
      <div className="home-hero__veil" />
      <a
        className="home-agency"
        href="https://www.meteo.gov.gh/"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Ghana Meteorological Agency website"
      >
        <img src={logo} alt="" />
        <span><strong>Ghana Meteorological Agency</strong><small>Weather · Climate · Water</small></span>
      </a>
      <div className="home-hero__content">
        <p className="home-hero__kicker">Ghana Meteorological Agency</p>
        <h1>Ghana Climate Atlas</h1>
        <p>Explore Ghana’s observed climate and future projections for temperature, rainfall and sea-level rise.</p>
        <div className="hero-actions">
          <RouteLink className="button button--cyan" to="/overview">Explore the Atlas <AtlasIcon name="arrow" size={18} /></RouteLink>
          <RouteLink className="button button--glass" to="/guide"><AtlasIcon name="book" size={18} /> How-to Guide</RouteLink>
        </div>
      </div>
      <div className="home-hero__credit">Authoritative climate information for resilient decisions</div>
    </section>
  </main>
);

const faqCategories = [
  {
    title: "General understanding of climate and climate change",
    questions: [
      ["What is the difference between weather and climate?", "Weather describes short-term atmospheric conditions in a place. Climate describes the statistical pattern of those conditions over a long period, usually at least 30 years."],
      ["What is climate change?", "Climate change is a persistent shift in climate patterns. Today’s rapid warming is driven mainly by human activities that alter the composition of the atmosphere, alongside natural variability."],
      ["Is Ghana already experiencing climate change?", "Yes. Ghana is experiencing rising temperatures, less predictable rainfall, coastal erosion and damaging extremes that affect agriculture, water, infrastructure and livelihoods."],
      ["What is climate adaptation?", "Adaptation means adjusting systems and decisions to reduce harm or make use of opportunities, such as improving drainage, protecting coasts or using drought-tolerant crops."],
    ],
  },
  {
    title: "About the Ghana Climate Atlas",
    questions: [
      ["What is a Climate Atlas?", "A Climate Atlas is a structured collection of climate information presented through maps, data and visualizations for a place and a range of time scales."],
      ["What is the Ghana Climate Atlas used for?", "It supports climate awareness, adaptation, agriculture, disaster-risk reduction, policy and socioeconomic planning by showing plausible future conditions across Ghana."],
      ["Who produced the Ghana Climate Atlas?", "The Ghana Meteorological Agency leads the Atlas with the Danish Meteorological Institute and support from the Danish Embassy in Accra."],
      ["Does the Atlas contain real-time observations?", "No. The Atlas is designed for long-term climate planning, not short-term weather forecasts or live observational monitoring."],
    ],
  },
  {
    title: "Scientific concepts behind the Atlas",
    questions: [
      ["What is an emissions scenario?", "An emissions scenario is a plausible pathway for future greenhouse-gas concentrations and societal development. The Atlas uses low, medium and high pathways so users can compare outcomes."],
      ["What are climate projections?", "Climate projections are model-based simulations of possible future climate conditions under stated emissions assumptions. They are not day-to-day forecasts."],
      ["Why does the Atlas show uncertainty?", "No single model captures every process perfectly. The Atlas uses a multi-model ensemble and shows percentile ranges so decisions can consider more than one plausible outcome."],
      ["What climate models were used?", "The indicators draw on 39 dynamically downscaled models from the CORDEX-Africa suite, processed to provide information at useful scales for Ghana."],
    ],
  },
  {
    title: "Using the Dashboard and Map Viewer",
    questions: [
      ["How do I begin?", "Use the Dashboard for time-series charts or open the Map Viewer to compare indicators geographically. Both tools let you change the climate indicator and emissions pathway."],
      ["Can I share my selection?", "Yes. Dashboard controls are saved in the page address, and the Map Viewer also preserves its selected state in shareable links."],
      ["Can I download the information?", "The Dashboard provides CSV export for the visible series. Reports are available from Documents, and tailored data can be requested through GMet."],
    ],
  },
];

export const OverviewPage = () => (
  <main id="main-content" className="public-main overview-page">
    <section className="observed-section" aria-labelledby="observed-title">
      <div className="public-container">
        <div className="observed-heading">
          <div><p className="eyebrow">Observed Climate Trends</p><h2 id="observed-title">Historical climate patterns in Ghana</h2></div>
          <p>Moist south-westerly winds support two rainfall peaks in southern Ghana and one in the north. Temperatures typically peak in March and are lowest around August.</p>
        </div>
        <div className="climatology-grid">
          <Suspense fallback={climatologyChartFallback}>
            <ObservedClimatologyChart data={OBSERVED_CLIMATOLOGY.north} />
          </Suspense>
          <Suspense fallback={climatologyChartFallback}>
            <ObservedClimatologyChart data={OBSERVED_CLIMATOLOGY.south} />
          </Suspense>
        </div>
      </div>
    </section>

    <section className="indicator-table-section" aria-labelledby="indicator-table-title">
      <div className="public-container">
        <div className="indicator-table-heading">
          <p className="eyebrow">Table of Indicators</p>
          <h2 id="indicator-table-title">Overview table of the key indicators presented in this report for Ghana</h2>
        </div>
        <div className="indicator-table__scroll" tabIndex={0} role="region" aria-labelledby="indicator-table-title">
          <table className="indicator-table">
            <thead>
              <tr>
                <th scope="col">Indicator</th>
                <th scope="col">Category</th>
                <th scope="col">Reference ({INDICATOR_SUMMARY_PERIODS.reference})</th>
                <th scope="col">Low emission ({INDICATOR_SUMMARY_PERIODS.low})</th>
                <th scope="col">Medium emission ({INDICATOR_SUMMARY_PERIODS.medium})</th>
                <th scope="col">High emission ({INDICATOR_SUMMARY_PERIODS.high})</th>
                <th scope="col">Unit</th>
              </tr>
            </thead>
            {INDICATOR_SUMMARY.map((group) => (
              <tbody key={group.indicator}>
                {group.rows.map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    {rowIndex === 0 && <th scope="rowgroup" rowSpan={group.rows.length}>{group.indicator}</th>}
                    <td>{row.category}</td>
                    <td>{row.reference}</td>
                    <td>{row.low}</td>
                    <td>{row.medium}</td>
                    <td>{row.high}</td>
                    <td>{row.unit}</td>
                  </tr>
                ))}
              </tbody>
            ))}
          </table>
        </div>
      </div>
    </section>

    <section className="faq-section" aria-labelledby="faq-title">
      <div className="public-container faq-heading">
        <p className="eyebrow">Frequently Asked Questions</p>
        <h2 id="faq-title">Answers to frequently asked questions</h2>
        <p>Use the categories below to understand the Atlas, its science and its tools.</p>
      </div>
      <div className="public-container faq-category-list">
        {faqCategories.map((category, categoryIndex) => (
          <details className="faq-category" key={category.title} open={categoryIndex === 0}>
            <summary><span>{String(categoryIndex + 1).padStart(2, "0")}</span><strong>{category.title}</strong><i aria-hidden="true">+</i></summary>
            <div className="faq-category__body">
              {category.questions.map(([question, answer]) => (
                <details className="faq-question" key={question}>
                  <summary>{question}<span aria-hidden="true">+</span></summary>
                  <div><p>{answer}</p></div>
                </details>
              ))}
            </div>
          </details>
        ))}
      </div>
    </section>

    <section className="overview-feature-section" aria-labelledby="overview-feature-heading">
      <div className="public-container">
        <div className="overview-feature-heading">
          <h2 id="overview-feature-heading">Latest updates</h2>
        </div>
        <div className="overview-feature-grid">
          <LatestUpdatesCard />
        </div>
      </div>
    </section>
  </main>
);

export const CaseStudiesPage = () => {
  const [filter, setFilter] = useState("All stories");
  const [activeStory, setActiveStory] = useState<ClimateStory | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [videoTrigger, setVideoTrigger] = useState<HTMLButtonElement | null>(null);
  const storyGridRef = useRef<HTMLUListElement>(null);
  const categories = useMemo(
    () => ["All stories", ...Array.from(new Set(CLIMATE_STORIES.map(({ category }) => category))).sort()],
    [],
  );
  const visibleStories = filter === "All stories" ? CLIMATE_STORIES : CLIMATE_STORIES.filter(({ category }) => category === filter);
  const pageCount = Math.max(1, Math.ceil(visibleStories.length / STORIES_PER_PAGE));
  const pageStart = (currentPage - 1) * STORIES_PER_PAGE;
  const paginatedStories = visibleStories.slice(pageStart, pageStart + STORIES_PER_PAGE);

  const goToPage = (page: number) => {
    const nextPage = Math.min(Math.max(page, 1), pageCount);
    if (nextPage === currentPage) return;

    setCurrentPage(nextPage);
    requestAnimationFrame(() => {
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      storyGridRef.current?.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
    });
  };

  return (
    <>
      <main id="main-content" className="public-main stories-page">
        <section className="public-section public-container">
          <div className="story-filter" aria-label="Filter case studies"><label htmlFor="story-category">Show</label><select id="story-category" value={filter} onChange={(event) => { setFilter(event.target.value); setCurrentPage(1); }}>{categories.map((category) => <option key={category}>{category}</option>)}</select><span aria-live="polite">Showing {pageStart + 1}–{Math.min(pageStart + STORIES_PER_PAGE, visibleStories.length)} of {visibleStories.length} {visibleStories.length === 1 ? "story" : "stories"}</span></div>
          <ul className="story-card-grid" ref={storyGridRef}>
          {paginatedStories.map((story) => (
            <StoryCard
              key={story.id}
              story={story}
              onWatch={(selectedStory, trigger) => {
                setVideoTrigger(trigger);
                setActiveStory(selectedStory);
              }}
            />
          ))}
          </ul>
          {pageCount > 1 && (
            <nav className="story-pagination" aria-label="Case study pages">
              <button
                aria-label="Previous case study page"
                className="story-pagination__direction story-pagination__previous"
                disabled={currentPage === 1}
                type="button"
                onClick={() => goToPage(currentPage - 1)}
              >
                <AtlasIcon name="chevron" size={17} /> <span>Previous</span>
              </button>
              <div className="story-pagination__pages">
                {Array.from({ length: pageCount }, (_, index) => index + 1).map((page) => (
                  <button
                    aria-current={page === currentPage ? "page" : undefined}
                    aria-label={`Case study page ${page}`}
                    className={page === currentPage ? "active" : ""}
                    key={page}
                    type="button"
                    onClick={() => goToPage(page)}
                  >
                    {String(page).padStart(2, "0")}
                  </button>
                ))}
              </div>
              <button
                aria-label="Next case study page"
                className="story-pagination__direction story-pagination__next"
                disabled={currentPage === pageCount}
                type="button"
                onClick={() => goToPage(currentPage + 1)}
              >
                <span>Next</span> <AtlasIcon name="chevron" size={17} />
              </button>
            </nav>
          )}
        </section>
      </main>
      {activeStory && (
        <StoryVideoModal
          returnFocusTo={videoTrigger}
          story={activeStory}
          onClose={() => setActiveStory(null)}
        />
      )}
    </>
  );
};

interface CaseStudyDetailPageProps {
  story: ClimateStory;
}

export const CaseStudyDetailPage = ({ story }: CaseStudyDetailPageProps) => {
  const [isVideoOpen, setIsVideoOpen] = useState(false);
  const [videoTrigger, setVideoTrigger] = useState<HTMLButtonElement | null>(null);
  const thumbnailUrl = getHostedVideoThumbnail(story.videoUrl);

  return (
    <>
      <main id="main-content" className="public-main case-study-detail-page">
        <section className="public-section public-container">
          <RouteLink className="case-study-detail__back" to="/case-studies">
            <AtlasIcon name="arrow" size={16} /> All case studies
          </RouteLink>
          <div className="case-study-detail__layout">
            <article className="case-study-detail__story">
              <p className="case-study-detail__meta">
                <span>{story.category}</span>
                <span aria-hidden="true">·</span>
                <span>{story.city}</span>
              </p>
              <h2>The story</h2>
              <p>{story.body}</p>
              {story.externalUrl && (
                <a
                  className="case-study-detail__source"
                  href={story.externalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Explore the source story <AtlasIcon name="external" size={16} />
                </a>
              )}
            </article>

            <aside className="case-study-detail__media" aria-label={`${story.title} video`}>
              <button
                type="button"
                onClick={(event) => {
                  setVideoTrigger(event.currentTarget);
                  setIsVideoOpen(true);
                }}
              >
                {story.videoSrc ? (
                  <video
                    aria-hidden="true"
                    muted
                    playsInline
                    preload="metadata"
                    src={`${story.videoSrc}#t=0.1`}
                    tabIndex={-1}
                  />
                ) : thumbnailUrl ? (
                  <img alt="" decoding="async" src={thumbnailUrl} />
                ) : null}
                <span className="case-study-detail__media-overlay" />
                <span className="case-study-detail__watch"><AtlasIcon name="play" size={20} /> Watch video</span>
              </button>
            </aside>
          </div>
        </section>
      </main>
      {isVideoOpen && (
        <StoryVideoModal
          returnFocusTo={videoTrigger}
          showDetailsLink={false}
          story={story}
          onClose={() => setIsVideoOpen(false)}
        />
      )}
    </>
  );
};

export const NotFoundPage = () => (
  <main id="main-content" className="public-main not-found-page"><div className="public-container"><p className="eyebrow">404 · Page not found</p><h1>This climate trail ends here.</h1><p>The page may have moved, or the address may be incomplete.</p><RouteLink className="button button--navy" to="/">Return home <AtlasIcon name="arrow" size={18} /></RouteLink></div></main>
);
