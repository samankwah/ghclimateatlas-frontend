import Skeleton, { SkeletonTheme, type SkeletonProps } from "react-loading-skeleton";

type SkeletonTone = "light" | "dark";

interface AtlasSkeletonProps extends SkeletonProps {
  tone?: SkeletonTone;
}

const AtlasSkeleton = ({ tone = "light", ...props }: AtlasSkeletonProps) => (
  <SkeletonTheme
    baseColor={tone === "dark" ? "#263d4d" : "#dfe8ec"}
    highlightColor={tone === "dark" ? "#3b5668" : "#f5f8f9"}
    borderRadius="3px"
    duration={1.35}
  >
    <Skeleton {...props} />
  </SkeletonTheme>
);

// Holds a chart's footprint while its Highcharts bundle loads on demand.
export const ChartSkeleton = ({ height }: { height: number }) => (
  <div className="chart-skeleton" role="status" aria-busy="true">
    <span className="visually-hidden">Loading chart…</span>
    <AtlasSkeleton height={height} />
  </div>
);

export const OverviewUpdatesSkeleton = () => (
  <section className="overview-updates-card overview-updates-card--skeleton" role="status" aria-busy="true">
    <span className="visually-hidden">Loading the latest Climate Atlas updates…</span>
    <div aria-hidden="true">
      <AtlasSkeleton tone="dark" width={110} height={9} />
      <div className="overview-updates-skeleton__body">
        <AtlasSkeleton tone="dark" width={78} height={16} />
        <AtlasSkeleton tone="dark" count={2} height={19} />
        <AtlasSkeleton tone="dark" width="86%" height={11} />
      </div>
      <AtlasSkeleton tone="dark" width={68} height={7} />
    </div>
  </section>
);

export const DashboardResultsSkeleton = ({ label }: { label: string }) => (
  <div className="dashboard-results dashboard-results--skeleton" role="status" aria-busy="true">
    <span className="visually-hidden">{label}</span>
    <div aria-hidden="true">
      <div className="dashboard-selection-bar dashboard-skeleton-selection">
        <AtlasSkeleton width={280} height={18} />
        <AtlasSkeleton width={160} height={14} />
      </div>

      {[0, 1].map((row) => (
        <div className="dashboard-content-row dashboard-skeleton-row" key={row}>
          <div className="dashboard-narrative dashboard-skeleton-narrative">
            <AtlasSkeleton width="38%" height={9} />
            <AtlasSkeleton width="82%" height={34} />
            <AtlasSkeleton count={3} height={13} />
            <div className="dashboard-skeleton-facts">
              <AtlasSkeleton count={3} height={30} />
            </div>
          </div>
          <div className="dashboard-chart-card dashboard-skeleton-chart">
            <div className="chart-card-heading">
              <div>
                <AtlasSkeleton width={210} height={18} />
                <AtlasSkeleton width={250} height={11} />
              </div>
              <AtlasSkeleton width={90} height={12} />
            </div>
            <AtlasSkeleton containerClassName="dashboard-skeleton-chart__plot" height={260} />
          </div>
        </div>
      ))}
    </div>
  </div>
);

export const DistrictChartSkeleton = () => (
  <div className="chart-loading chart-loading--skeleton" role="status" aria-busy="true">
    <span className="visually-hidden">Loading chart data…</span>
    <div className="district-chart-skeleton" aria-hidden="true">
      <div className="district-chart-skeleton__heading">
        <AtlasSkeleton tone="dark" width="44%" height={12} />
        <AtlasSkeleton tone="dark" width="27%" height={10} />
      </div>
      <AtlasSkeleton tone="dark" containerClassName="district-chart-skeleton__plot" height={210} />
      <AtlasSkeleton tone="dark" width="32%" height={10} />
    </div>
  </div>
);

export const StoryMediaSkeleton = () => (
  <span className="story-card__media-skeleton" aria-hidden="true">
    <AtlasSkeleton
      borderRadius={0}
      containerClassName="story-card__media-skeleton-inner"
      height="100%"
    />
  </span>
);

export const DocumentsPageSkeleton = () => (
  <main id="main-content" className="public-main documents-page">
    <section
      aria-busy="true"
      aria-label="Loading documents"
      className="resource-page-section public-container documents-page-skeleton"
      role="status"
    >
      <span className="visually-hidden">Loading documents…</span>
      <div aria-hidden="true">
        <div className="resource-page-intro documents-skeleton-intro">
          <AtlasSkeleton width={150} height={9} />
          <AtlasSkeleton width={360} height={34} />
          <AtlasSkeleton count={2} width="70%" height={13} />
        </div>
        <div className="document-browser documents-skeleton-browser">
          <div>
            <AtlasSkeleton width={120} height={11} />
            <AtlasSkeleton height={48} />
          </div>
          <div>
            <AtlasSkeleton width={110} height={11} />
            <AtlasSkeleton width={360} height={48} />
          </div>
        </div>
        <AtlasSkeleton containerClassName="documents-skeleton-count" width={130} height={12} />
        <div className="document-results">
          {[0, 1].map((row) => (
            <div className="document-result documents-skeleton-result" key={row}>
              <AtlasSkeleton height={48} width={48} />
              <div>
                <AtlasSkeleton width="28%" height={9} />
                <AtlasSkeleton width="66%" height={20} />
                <AtlasSkeleton count={2} height={12} />
                <AtlasSkeleton width="54%" height={10} />
              </div>
              <div className="documents-skeleton-meta">
                <AtlasSkeleton count={3} height={12} />
                <AtlasSkeleton height={44} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  </main>
);

export const GuidePageSkeleton = () => (
  <main id="main-content" className="public-main guide-page">
    <div
      aria-busy="true"
      aria-label="Loading the How-to Guide"
      className="guide-simple public-container guide-page-skeleton"
      role="status"
    >
      <span className="visually-hidden">Loading the How-to Guide…</span>
      <div aria-hidden="true">
        <div className="guide-jump-links guide-skeleton-jumps">
          <AtlasSkeleton width={95} height={12} />
          <AtlasSkeleton width={90} height={12} />
          <AtlasSkeleton width={82} height={12} />
          <AtlasSkeleton width={105} height={12} />
        </div>
        <section className="guide-section guide-skeleton-section">
          <AtlasSkeleton width={90} height={9} />
          <AtlasSkeleton width="72%" height={34} />
          <AtlasSkeleton count={2} height={14} />
          <div className="guide-skeleton-actions">
            <AtlasSkeleton width={190} height={46} />
            <AtlasSkeleton width={150} height={14} />
          </div>
        </section>
        {[0, 1].map((section) => (
          <section className="guide-section guide-skeleton-section" key={section}>
            <AtlasSkeleton width={115} height={9} />
            <AtlasSkeleton width="62%" height={30} />
            <div className="guide-skeleton-list">
              {[0, 1, 2].map((row) => (
                <div key={row}>
                  <AtlasSkeleton circle height={38} width={38} />
                  <span>
                    <AtlasSkeleton width="45%" height={15} />
                    <AtlasSkeleton width="88%" height={12} />
                  </span>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  </main>
);

export default AtlasSkeleton;
