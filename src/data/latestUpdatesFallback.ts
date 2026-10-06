// Offline snapshot of the GMet Climate Atlas update feed.
//
// Rendered only when the API cannot be reached (a preview deploy with no
// backend, or an outage), and always labelled as a saved copy in the UI so it
// is never mistaken for live data. Regenerate from:
//   curl "<api>/news/latest"
//
// Like the live feed, it holds only on-topic updates and leaves out the
// articles in the backend's EXCLUDED_SLUGS. Captured 2026-10-06 from
// https://www.meteo.gov.gh/news/

import type { AtlasNewsItem } from "../types/news";

export const LATEST_UPDATES_FALLBACK: AtlasNewsItem[] = [
  {
    id: "beyond-training-and-apply-the-knowledge-dr-ignatius-kweku-williams-charges-trainees",
    kind: "news",
    title: "Move Beyond Training and Apply the Knowledge – Dr. Ignatius Kweku Williams Charges Trainees",
    summary: "The Deputy Director-General, Operations of the Ghana Meteorological Agency (GMet), Dr. Ignatius Kweku Williams, has urged participants of the Python Training P",
    category: "Articles",
    published_at: "2026-08-03",
    published_label: "03 Aug 2026",
    url: "https://www.meteo.gov.gh/news/beyond-training-and-apply-the-knowledge-dr-ignatius-kweku-williams-charges-trainees/",
    image_url: "https://www.meteo.gov.gh/media/images/656A2220.width-800.jpg",
    image_fallback_url: "https://www.meteo.gov.gh/media/images/656A2220.original.jpg",
  },
  {
    id: "gmet-begins-python-training-to-strengthen-climate-data-analytics",
    kind: "news",
    title: "GMet Begins Python Training to Strengthen Climate Data Analytics",
    summary: "The Ghana Meteorological Agency (GMet), in collaboration with the Danish Meteorological Institute (DMI) and the Embassy of Denmark in Ghana under the SSC-Meteo",
    category: "Articles",
    published_at: "2026-07-27",
    published_label: "27 Jul 2026",
    url: "https://www.meteo.gov.gh/news/gmet-begins-python-training-to-strengthen-climate-data-analytics/",
    image_url: "https://www.meteo.gov.gh/media/images/GMET2087.width-800.jpg",
    image_fallback_url: "https://www.meteo.gov.gh/media/images/GMET2087.original.jpg",
  },
  {
    id: "gmet-engages-ndpc-on-climate-atlas-application-for-national-development-planning",
    kind: "news",
    title: "GMet Engages NDPC on Climate Atlas Application for National Development Planning",
    summary: "The Ghana Meteorological Agency (GMet) has engaged the National Development Planning Commission (NDPC) to explore practical applications of the Ghana Climate A",
    category: "Articles",
    published_at: "2026-07-20",
    published_label: "20 Jul 2026",
    url: "https://www.meteo.gov.gh/news/gmet-engages-ndpc-on-climate-atlas-application-for-national-development-planning/",
    image_url: "https://www.meteo.gov.gh/media/images/GMET1797.width-800.jpg",
    image_fallback_url: "https://www.meteo.gov.gh/media/images/GMET1797.original.jpg",
  },
  {
    id: "gmet-launches-ghana-climate-atlas-to-support-climate-resilient-development",
    kind: "news",
    title: "GMet Launches Ghana Climate Atlas to Support Climate-Resilient Development",
    summary: "In a significant step toward strengthening climate-resilient development, the Ghana Meteorological Agency, in collaboration with the Danish Meteorological Inst",
    category: "Articles",
    published_at: "2026-03-25",
    published_label: "25 Mar 2026",
    url: "https://www.meteo.gov.gh/news/gmet-launches-ghana-climate-atlas-to-support-climate-resilient-development/",
    image_url: "https://www.meteo.gov.gh/media/images/_MG_9120.width-800.jpg",
    image_fallback_url: "https://www.meteo.gov.gh/media/images/_MG_9120.original.jpg",
  },
];
