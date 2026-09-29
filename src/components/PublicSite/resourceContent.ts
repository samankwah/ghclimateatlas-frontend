export type DocumentCategory = "summary" | "technical";
export type DocumentFilter = "all" | DocumentCategory;

export interface AtlasDocument {
  id: string;
  title: string;
  description: string;
  category: DocumentCategory;
  categoryLabel: string;
  year: number;
  format: "PDF";
  publisher: string;
  topics: string[];
  href: string;
}

export const ATLAS_DOCUMENTS: AtlasDocument[] = [
  {
    id: "atlas-summary-2026",
    title: "Ghana Climate Atlas Summary Report",
    description:
      "A concise overview of Ghana’s observed climate, headline projections, priority indicators and implications for national planning.",
    category: "summary",
    categoryLabel: "Summary report",
    year: 2026,
    format: "PDF",
    publisher: "Ghana Meteorological Agency",
    topics: ["Climate overview", "Headline projections", "Planning"],
    href: "https://www.meteo.gov.gh/documents/9821/Summary_of_the_Ghana_Climate_Atlas_Report_final_20260324.pdf",
  },
  {
    id: "atlas-technical-2026",
    title: "Ghana Climate Atlas Full Report 2026",
    description:
      "The complete technical report covering methods, model ensembles, national indicator results, limitations and interpretation guidance.",
    category: "technical",
    categoryLabel: "Technical report",
    year: 2026,
    format: "PDF",
    publisher: "Ghana Meteorological Agency",
    topics: ["Methods", "Model ensembles", "Climate indicators", "Interpretation"],
    href: "https://www.meteo.gov.gh/documents/9826/Ghana_Climate_Atlas_Report_2026_WLyLYyL.pdf",
  },
];

const normalizedSearchText = (document: AtlasDocument): string =>
  [
    document.title,
    document.description,
    document.categoryLabel,
    document.publisher,
    document.format,
    document.year,
    ...document.topics,
  ]
    .join(" ")
    .toLocaleLowerCase();

export const filterAtlasDocuments = (
  documents: AtlasDocument[],
  query: string,
  filter: DocumentFilter,
): AtlasDocument[] => {
  const normalizedQuery = query.trim().toLocaleLowerCase();

  return documents.filter((document) => {
    const matchesFilter = filter === "all" || document.category === filter;
    const matchesQuery = !normalizedQuery || normalizedSearchText(document).includes(normalizedQuery);
    return matchesFilter && matchesQuery;
  });
};

export const documentCountForFilter = (
  documents: AtlasDocument[],
  filter: DocumentFilter,
): number => filter === "all"
  ? documents.length
  : documents.filter((document) => document.category === filter).length;
