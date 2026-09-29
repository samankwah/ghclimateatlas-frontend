// Climate Atlas update feed published by GMet on meteo.gov.gh.
// Field names mirror the API payload, matching the convention in types/climate.ts.

export type AtlasNewsKind = "news" | "publication";

export interface AtlasNewsItem {
  id: string;
  kind: AtlasNewsKind;
  title: string;
  summary: string;
  category: string;
  published_at: string | null; // ISO date, null when the upstream label is unparseable
  published_label: string;
  url: string;
  image_url: string | null;
  image_fallback_url: string | null;
}

export interface AtlasNewsFeed {
  items: AtlasNewsItem[];
  fetched_at: string;
  stale: boolean;
  source_url: string;
  all_news_url: string;
  all_publications_url: string;
}
