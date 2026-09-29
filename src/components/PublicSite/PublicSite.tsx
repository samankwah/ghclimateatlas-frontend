import { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react";
import logo from "../../assets/smart-logo-gmet.webp";
import { useDistrictList } from "../../hooks/useClimateData";
import { CLIMATE_STORIES } from "../../data/climateStories";
import type { ClimateStory } from "../../types/story";
import { DocumentsPageSkeleton, GuidePageSkeleton } from "../Loading/SkeletonLoaders";
import ClimateDataRequestModal from "../Downloads/ClimateDataRequestModal";
import { buildDataRequestGeographyOptions } from "../Downloads/dataRequestForm";
import {
  caseStudyIdFromPathname,
  isRouteActive,
  PUBLIC_NAV_ITEMS,
  type PublicRoutePath,
} from "../../utils/publicRouting";
import AtlasIcon, { type AtlasIconName } from "./AtlasIcon";
import DashboardPage from "./DashboardPage";
import {
  CaseStudyDetailPage,
  CaseStudiesPage,
  HomePage,
  NotFoundPage,
  OverviewPage,
} from "./PublicPages";
import RouteLink from "./RouteLink";
import "./public-site.css";

const DocumentsPage = lazy(() => import("./DocumentsPage"));
const GuidePage = lazy(() => import("./GuidePage"));

interface PublicSiteProps {
  pathname: string;
  search: string;
}

const pageTitles: Record<PublicRoutePath, string> = {
  "/": "Ghana Climate Atlas | Ghana Meteorological Agency",
  "/overview": "Climate Overview | Ghana Climate Atlas",
  "/dashboard": "Climate Dashboard | Ghana Climate Atlas",
  "/case-studies": "Climate Case Studies | Ghana Climate Atlas",
  "/documents": "Reports and Documents | Ghana Climate Atlas",
  "/guide": "How-to Guide | Ghana Climate Atlas",
};

const defaultMasthead = {
  kicker: "Ghana Climate Atlas",
  title: "Climate Change in Ghana",
  description: "Changes in temperature, rainfall and sea level rise",
};

const routeMastheads: Partial<Record<PublicRoutePath, typeof defaultMasthead>> = {
  "/overview": {
    kicker: "Ghana Climate Atlas",
    title: "Climate Change in Ghana",
    description: "Review the national picture before exploring detailed maps, projections and local stories.",
  },
  "/dashboard": {
    kicker: "Climate data explorer",
    title: "Climate Dashboard",
    description: "Compare district projections by indicator, emissions pathway and time period.",
  },
  "/case-studies": {
    kicker: "Case Studies",
    title: "Climate change, told from the places experiencing it",
    description: "Explore community stories about risk, resilience, livelihoods and adaptation across Ghana.",
  },
  "/documents": {
    kicker: "Resources",
    title: "Documents",
    description: "Search and open official Ghana Climate Atlas reports from GMet.",
  },
  "/guide": {
    kicker: "Help and guidance",
    title: "Use the Ghana Climate Atlas",
    description: "Choose the right tool, follow the map workflow and understand the results.",
  },
};

const headerIndicators = [
  { icon: "thermometer" as const, title: "Higher Temperatures", value: "+1.5°C", note: "by end of century" },
  { icon: "rain" as const, title: "More Rainfall Variability", value: "+1.8%", note: "annual rainfall" },
  { icon: "wave" as const, title: "Rise in Mean Sea Level", value: "0.4–0.7m", note: "along Ghana’s coast" },
];

type HeroIndicatorTone = "coral" | "blue" | "teal" | "navy";

interface HeroIndicator {
  description: string;
  icon: AtlasIconName;
  title: string;
  tone: HeroIndicatorTone;
}

const routeHeroIndicators: Partial<Record<PublicRoutePath, HeroIndicator[]>> = {
  "/overview": [
    {
      title: "Temperature trends",
      icon: "thermometer",
      tone: "coral",
      description: "See how warming differs across Ghana and through the century.",
    },
    {
      title: "Rainfall patterns",
      icon: "rain",
      tone: "blue",
      description: "Explore annual totals, seasonal shifts and rainfall variability.",
    },
    {
      title: "Coastal change",
      icon: "wave",
      tone: "teal",
      description: "Review projected sea-level rise along Ghana’s coastline.",
    },
  ],
  "/dashboard": [
    {
      title: "Build your view",
      icon: "map",
      tone: "coral",
      description: "Set a district, climate indicator and time period in one place.",
    },
    {
      title: "Compare pathways",
      icon: "compass",
      tone: "blue",
      description: "Test how different emissions pathways change the outlook.",
    },
    {
      title: "Export the series",
      icon: "download",
      tone: "teal",
      description: "Download the selected time series as a reusable CSV file.",
    },
  ],
  "/case-studies": [
    {
      title: `${CLIMATE_STORIES.length} local stories`,
      icon: "users",
      tone: "coral",
      description: "Hear directly from communities across Ghana.",
    },
    {
      title: "Explore by place",
      icon: "map",
      tone: "blue",
      description: "Understand how climate risks differ from coast to north.",
    },
    {
      title: "Watch and learn",
      icon: "play",
      tone: "teal",
      description: "Open short videos and learn how communities are responding.",
    },
  ],
  "/documents": [
    {
      title: "Official resources",
      icon: "document",
      tone: "coral",
      description: "Browse reports published for the Ghana Climate Atlas.",
    },
    {
      title: "Search and filter",
      icon: "search",
      tone: "blue",
      description: "Find a report by title, topic, keyword or document type.",
    },
    {
      title: "Open the source",
      icon: "external",
      tone: "teal",
      description: "View the original PDF with its date and file details.",
    },
  ],
  "/guide": [
    {
      title: "Choose a tool",
      icon: "compass",
      tone: "coral",
      description: "Start with the Map Viewer or Dashboard for your task.",
    },
    {
      title: "Follow the workflow",
      icon: "map",
      tone: "blue",
      description: "Move from location and indicator to period and pathway.",
    },
    {
      title: "Read and use results",
      icon: "chart",
      tone: "teal",
      description: "Interpret uncertainty, then export or share your selection.",
    },
  ],
};

const caseStudyHeroIndicators = (story: ClimateStory): HeroIndicator[] => [
  {
    title: "Story location and topic",
    icon: "map",
    tone: "coral",
    description: `${story.city} · ${story.category}`,
  },
  {
    title: "Watch the story",
    icon: "play",
    tone: "blue",
    description: "Open the video to hear the place-based perspective.",
  },
  {
    title: "Story context",
    icon: "book",
    tone: "teal",
    description: "Read the local impacts, risks and response in context.",
  },
];

const caseStudyFromPathname = (pathname: string) => {
  const storyId = caseStudyIdFromPathname(pathname);
  return storyId ? CLIMATE_STORIES.find(({ id }) => id === storyId) : undefined;
};

const renderPage = (
  pathname: string,
  search: string,
  onOpenDataRequest: () => void,
) => {
  const caseStudy = caseStudyFromPathname(pathname);
  if (caseStudy) return <CaseStudyDetailPage story={caseStudy} />;
  if (caseStudyIdFromPathname(pathname)) return <NotFoundPage />;

  switch (pathname) {
    case "/": return <HomePage />;
    case "/overview": return <OverviewPage />;
    case "/dashboard": return <DashboardPage search={search} />;
    case "/case-studies": return <CaseStudiesPage />;
    case "/documents": return (
      <Suspense fallback={<DocumentsPageSkeleton />}>
        <DocumentsPage onOpenDataRequest={onOpenDataRequest} />
      </Suspense>
    );
    case "/guide": return (
      <Suspense fallback={<GuidePageSkeleton />}>
        <GuidePage />
      </Suspense>
    );
    default: return <NotFoundPage />;
  }
};

const PublicSite = ({ pathname, search }: PublicSiteProps) => {
  const atlasTabsRef = useRef<HTMLElement>(null);
  const isHome = pathname === "/";
  const [dataRequestOpen, setDataRequestOpen] = useState(false);
  const districtListQuery = useDistrictList(dataRequestOpen);
  const geographyOptions = useMemo(
    () => buildDataRequestGeographyOptions(districtListQuery.data ?? []),
    [districtListQuery.data],
  );
  const isOverview = pathname === "/overview";
  const caseStudy = caseStudyFromPathname(pathname);
  const hasClimateHero = isOverview || Boolean(caseStudy) || ["/dashboard", "/case-studies", "/documents", "/guide"].includes(pathname);
  const masthead = caseStudy
    ? {
        kicker: `${caseStudy.category} · ${caseStudy.city}`,
        title: caseStudy.title,
        description: caseStudy.description,
      }
    : routeMastheads[pathname as PublicRoutePath] ?? defaultMasthead;
  const heroIndicators = caseStudy
    ? caseStudyHeroIndicators(caseStudy)
    : routeHeroIndicators[pathname as PublicRoutePath] ?? [];

  useEffect(() => {
    document.title = caseStudy
      ? `${caseStudy.title} | Ghana Climate Atlas`
      : pageTitles[pathname as PublicRoutePath] ?? "Page not found | Ghana Climate Atlas";
  }, [caseStudy, pathname]);

  useEffect(() => {
    const tabList = atlasTabsRef.current;
    const activeTab = tabList?.querySelector<HTMLElement>('a[aria-current="page"]');
    if (!tabList || !activeTab || tabList.scrollWidth <= tabList.clientWidth) return;

    tabList.scrollLeft = Math.max(
      0,
      activeTab.offsetLeft - (tabList.clientWidth - activeTab.offsetWidth) / 2,
    );
  }, [pathname]);

  if (isHome) {
    return (
      <div className="public-site public-site--home">
        <a className="skip-link" href="#main-content">Skip to main content</a>
        {renderPage(pathname, search, () => setDataRequestOpen(true))}
      </div>
    );
  }

  return (
    <div className={`public-site${hasClimateHero ? " public-site--overview" : ""}`}>
      <a className="skip-link" href="#main-content">Skip to main content</a>
      <header className="public-header">
        <div className="climate-masthead">
          <div className="public-container climate-masthead__content">
            <p>{masthead.kicker}</p>
            <h1>{masthead.title}</h1>
            <span>{masthead.description}</span>
          </div>
        </div>

        {hasClimateHero ? (
          <div
            className="header-indicators overview-indicators public-container"
            aria-label={`${masthead.title} page highlights`}
          >
            {heroIndicators.map((indicator) => (
              <article className={`overview-indicator overview-indicator--${indicator.tone}`} key={indicator.title}>
                <div className="overview-indicator-heading">
                  <span className="header-indicators__icon" aria-hidden="true">
                    <AtlasIcon name={indicator.icon} size={20} />
                  </span>
                  <h2>{indicator.title}</h2>
                </div>
                <p>{indicator.description}</p>
              </article>
            ))}
          </div>
        ) : (
          <div className="header-indicators public-container" aria-label="Summary of key climate indicators">
            {headerIndicators.map((indicator) => (
              <article key={indicator.title}>
                <span className="header-indicators__icon"><AtlasIcon name={indicator.icon} size={22} /></span>
                <span><small>{indicator.title}</small><strong>{indicator.value}</strong><em>{indicator.note}</em></span>
              </article>
            ))}
          </div>
        )}

        <nav ref={atlasTabsRef} className="atlas-tabs" aria-label="Climate Atlas sections">
          <div className="public-container atlas-tabs__inner">
            {PUBLIC_NAV_ITEMS.slice(0, 2).map((item) => (
              <RouteLink key={item.href} className={isRouteActive(pathname, item.href) ? "active" : ""} to={item.href} aria-current={isRouteActive(pathname, item.href) ? "page" : undefined}>{item.label}</RouteLink>
            ))}
            <RouteLink className="atlas-tabs__map" to="/map">Map Viewer</RouteLink>
            {PUBLIC_NAV_ITEMS.slice(2).map((item) => (
              <RouteLink key={item.href} className={isRouteActive(pathname, item.href) ? "active" : ""} to={item.href} aria-current={isRouteActive(pathname, item.href) ? "page" : undefined}>{item.label}</RouteLink>
            ))}
          </div>
        </nav>
      </header>

      {renderPage(pathname, search, () => setDataRequestOpen(true))}

      <footer className="public-footer">
        <div className="public-container public-footer__grid">
          <div className="footer-brand">
            <img src={logo} alt="" />
            <div><strong>Ghana Climate Atlas</strong><span>Ghana Meteorological Agency</span></div>
          </div>
          <div><h2>Explore</h2><RouteLink to="/overview">Overview</RouteLink><RouteLink to="/dashboard">Dashboard</RouteLink><RouteLink to="/map">Map Viewer</RouteLink><RouteLink to="/case-studies">Case Studies</RouteLink></div>
          <div><h2>Resources</h2><RouteLink to="/guide">How-To Guide</RouteLink><RouteLink to="/documents">Documents</RouteLink><button className="public-footer__link-button" type="button" onClick={() => setDataRequestOpen(true)}>Data Request</button></div>
          <div className="footer-partnership"><h2>A climate service partnership</h2><p>Produced by GMet with the Danish Meteorological Institute and support from the Danish Embassy in Accra.</p></div>
        </div>
        <div className="public-container public-footer__bottom"><span>© Ghana Meteorological Agency 2026</span><span>Climate information for resilient decisions</span></div>
      </footer>

      <ClimateDataRequestModal
        open={dataRequestOpen}
        regionOptions={geographyOptions.regionOptions}
        districtOptions={geographyOptions.districtOptions}
        geographyOptionsLoading={districtListQuery.isLoading}
        geographyOptionsError={districtListQuery.isError}
        onClose={() => setDataRequestOpen(false)}
      />
    </div>
  );
};

export default PublicSite;
