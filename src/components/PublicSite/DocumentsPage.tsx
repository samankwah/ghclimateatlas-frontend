import { useMemo, useState } from "react";
import AtlasIcon from "./AtlasIcon";
import RouteLink from "./RouteLink";
import {
  ATLAS_DOCUMENTS,
  documentCountForFilter,
  filterAtlasDocuments,
  type DocumentFilter,
} from "./resourceContent";

const documentFilters: Array<{ label: string; value: DocumentFilter }> = [
  { label: "All documents", value: "all" },
  { label: "Summaries", value: "summary" },
  { label: "Technical reports", value: "technical" },
];

interface DocumentsPageProps {
  onOpenDataRequest: () => void;
}

const DocumentsPage = ({ onOpenDataRequest }: DocumentsPageProps) => {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<DocumentFilter>("all");
  const filteredDocuments = useMemo(
    () => filterAtlasDocuments(ATLAS_DOCUMENTS, query, filter),
    [filter, query],
  );
  const hasActiveFilters = query.trim().length > 0 || filter !== "all";

  const clearFilters = () => {
    setQuery("");
    setFilter("all");
  };

  return (
    <main id="main-content" className="public-main documents-page">
      <section className="resource-page-section public-container" aria-labelledby="documents-library-heading">
        <div className="resource-page-intro">
          <p className="eyebrow">Publication library</p>
          <h2 id="documents-library-heading">Official Atlas reports</h2>
          <p>Find the short briefing for a quick overview or open the full report for methods, evidence and interpretation guidance.</p>
        </div>

        <form className="document-browser" role="search" onSubmit={(event) => event.preventDefault()}>
          <div className="document-search-field">
            <label htmlFor="document-search">Search documents</label>
            <div className="document-search-input">
              <AtlasIcon name="search" size={20} />
              <input
                id="document-search"
                type="search"
                value={query}
                placeholder="Search by title, topic or keyword"
                autoComplete="off"
                onChange={(event) => setQuery(event.target.value)}
              />
              {query && (
                <button type="button" aria-label="Clear document search" onClick={() => setQuery("")}>
                  <AtlasIcon name="close" size={18} />
                </button>
              )}
            </div>
          </div>

          <fieldset className="document-filter-group">
            <legend>Document type</legend>
            <div>
              {documentFilters.map((option) => (
                <button
                  type="button"
                  key={option.value}
                  aria-pressed={filter === option.value}
                  onClick={() => setFilter(option.value)}
                >
                  <span>{option.label}</span>
                  <small>{documentCountForFilter(ATLAS_DOCUMENTS, option.value)}</small>
                </button>
              ))}
            </div>
          </fieldset>
        </form>

        <div className="document-results-heading">
          <p aria-live="polite" aria-atomic="true">
            <strong>{filteredDocuments.length}</strong> {filteredDocuments.length === 1 ? "document" : "documents"}
            {hasActiveFilters ? " found" : " available"}
          </p>
          {hasActiveFilters && (
            <button className="text-button" type="button" onClick={clearFilters}>Clear filters</button>
          )}
        </div>

        {filteredDocuments.length > 0 ? (
          <ul className="document-results">
            {filteredDocuments.map((document) => (
              <li key={document.id}>
                <article className="document-result">
                  <div className="document-result__icon" aria-hidden="true">
                    <AtlasIcon name="document" size={24} />
                  </div>
                  <div className="document-result__content">
                    <p className="document-result__publisher">{document.publisher}</p>
                    <h3>{document.title}</h3>
                    <p>{document.description}</p>
                    <ul className="document-result__topics" aria-label="Topics">
                      {document.topics.map((topic) => <li key={topic}>{topic}</li>)}
                    </ul>
                  </div>
                  <div className="document-result__details">
                    <dl>
                      <div><dt>Type</dt><dd>{document.categoryLabel}</dd></div>
                      <div><dt>Published</dt><dd>{document.year}</dd></div>
                      <div><dt>Format</dt><dd>{document.format}</dd></div>
                    </dl>
                    <a href={document.href} target="_blank" rel="noopener noreferrer">
                      Open PDF <AtlasIcon name="external" size={16} />
                      <span className="visually-hidden">: {document.title} (opens in a new tab)</span>
                    </a>
                  </div>
                </article>
              </li>
            ))}
          </ul>
        ) : (
          <div className="document-empty-state" role="status">
            <AtlasIcon name="document" size={28} />
            <h3>No documents match your search</h3>
            <p>Try a broader keyword or remove the document-type filter.</p>
            <button className="button button--navy" type="button" onClick={clearFilters}>Show all documents</button>
          </div>
        )}

        <aside className="document-data-help" aria-labelledby="document-data-help-heading">
          <div>
            <h2 id="document-data-help-heading">Need data rather than a report?</h2>
            <p>Explore indicators on the map or request a tailored dataset directly from GMet.</p>
          </div>
          <div>
            <RouteLink className="text-link" to="/map">Open Map Viewer <AtlasIcon name="arrow" size={16} /></RouteLink>
            <button className="text-link" type="button" onClick={onOpenDataRequest}>
              Request climate data <AtlasIcon name="download" size={15} />
            </button>
          </div>
        </aside>
      </section>
    </main>
  );
};

export default DocumentsPage;
