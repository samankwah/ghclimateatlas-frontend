import AtlasIcon from "./AtlasIcon";
import RouteLink from "./RouteLink";

const mapSteps = [
  {
    title: "Choose a place",
    description: "Search for a district or select one directly on the map to open its local climate profile.",
  },
  {
    title: "Select an indicator",
    description: "Choose temperature, rainfall or sea-level information from the indicator menus.",
  },
  {
    title: "Set the time period",
    description: "Compare the 1991–2020 reference period with the near term, mid-century or end of century.",
  },
  {
    title: "Choose an emissions pathway",
    description: "For future periods, switch between low, medium and high pathways while keeping the other settings fixed.",
  },
  {
    title: "Read and share the result",
    description: "Confirm the title, unit and legend, then open district details or share the current map view.",
  },
];

const GuidePage = () => (
  <main id="main-content" className="public-main guide-page">
    <div className="guide-simple public-container">
      <nav className="guide-jump-links" aria-label="Guide sections">
        <strong>In this guide</strong>
        <a href="#choose-a-tool">Choose a tool</a>
        <a href="#use-the-map">Use the map</a>
        <a href="#read-results">Read the results</a>
      </nav>

      <section className="guide-section guide-introduction" aria-labelledby="guide-introduction-heading">
        <p className="eyebrow">Quick start</p>
        <h2 id="guide-introduction-heading">Find the climate information you need</h2>
        <p className="guide-lede">The Ghana Climate Atlas helps you compare long-term climate conditions and future projections across Ghana. It is not a short-term weather forecast.</p>
        <div className="guide-start-actions">
          <RouteLink className="button button--navy" to="/map">Open Map Viewer <AtlasIcon name="arrow" size={17} /></RouteLink>
          <RouteLink className="text-link" to="/map?tour=1">Take the guided tour <AtlasIcon name="arrow" size={15} /></RouteLink>
        </div>
      </section>

      <section className="guide-section" id="choose-a-tool" aria-labelledby="choose-a-tool-heading">
        <p className="guide-section-label">1 · Choose a tool</p>
        <h2 id="choose-a-tool-heading">Start with the view that matches your task</h2>
        <div className="guide-tool-list">
          <article>
            <div><AtlasIcon name="map" size={21} /></div>
            <h3>Map Viewer</h3>
            <p>Compare indicators, places, periods and emissions pathways across Ghana.</p>
            <RouteLink to="/map">Open map <AtlasIcon name="arrow" size={14} /></RouteLink>
          </article>
          <article>
            <div><AtlasIcon name="chart" size={21} /></div>
            <h3>Dashboard</h3>
            <p>Follow one district through time, inspect the model range and download chart data.</p>
            <RouteLink to="/dashboard">Open dashboard <AtlasIcon name="arrow" size={14} /></RouteLink>
          </article>
          <article>
            <div><AtlasIcon name="document" size={21} /></div>
            <h3>Documents</h3>
            <p>Read the methods, evidence, limitations and official Atlas findings.</p>
            <RouteLink to="/documents">Browse reports <AtlasIcon name="arrow" size={14} /></RouteLink>
          </article>
        </div>
      </section>

      <section className="guide-section" id="use-the-map" aria-labelledby="use-the-map-heading">
        <p className="guide-section-label">2 · Use the map</p>
        <h2 id="use-the-map-heading">Follow five steps</h2>
        <p>Work from place to indicator to future assumptions. The map title and legend confirm what you are viewing.</p>
        <ol className="guide-procedure">
          {mapSteps.map((step, index) => (
            <li key={step.title}>
              <div className="guide-procedure__number" aria-hidden="true">{index + 1}</div>
              <div>
                <h3><span className="visually-hidden">Step {index + 1}: </span>{step.title}</h3>
                <p>{step.description}</p>
              </div>
            </li>
          ))}
        </ol>

        <div className="guide-example" aria-labelledby="guide-example-heading">
          <div>
            <p className="eyebrow">Try an example</p>
            <h3 id="guide-example-heading">End-of-century temperature in Accra</h3>
            <p>Annual mean temperature · RCP 4.5 · 2081–2100 · Accra Metropolitan</p>
          </div>
          <RouteLink to="/map?variable=annual_mean_temp&period=2080&scenario=rcp45&district=GH-GRE-ACCRA">
            Open example <AtlasIcon name="arrow" size={15} />
          </RouteLink>
        </div>
      </section>

      <section className="guide-section" id="read-results" aria-labelledby="read-results-heading">
        <p className="guide-section-label">3 · Read the results</p>
        <h2 id="read-results-heading">Check three things before using a result</h2>
        <ol className="guide-principles">
          <li><strong>Period</strong><span>A future period is a multi-year average, not a forecast for one individual year.</span></li>
          <li><strong>Pathway</strong><span>An emissions pathway is a plausible assumption. Compare pathways with the other selections fixed.</span></li>
          <li><strong>Legend and range</strong><span>Confirm the unit and whether values are absolute or changes. On the Dashboard, the band shows the model range.</span></li>
        </ol>
        <aside className="guide-note"><strong>For planning or research</strong><p>Use more than one indicator or pathway for high-impact decisions, and read the technical report for methods and limitations.</p></aside>
      </section>

      <aside className="guide-support" aria-labelledby="guide-support-heading">
        <div>
          <h2 id="guide-support-heading">Need more detail?</h2>
          <p>Take the interactive tour in the map or read the official Atlas reports.</p>
        </div>
        <div>
          <RouteLink className="text-link" to="/map?tour=1">Start guided tour <AtlasIcon name="arrow" size={15} /></RouteLink>
          <RouteLink className="text-link" to="/documents">Browse documents <AtlasIcon name="arrow" size={15} /></RouteLink>
        </div>
      </aside>
    </div>
  </main>
);

export default GuidePage;
