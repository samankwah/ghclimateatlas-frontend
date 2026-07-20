import denmarkFlag from "../../assets/denmark-flag.svg";
import dmiLogo from "../../assets/dmi-logo.svg";

const PanelPartners: React.FC = () => {
  return (
    <section className="panel-partners" aria-label="Project partners">
      <p className="panel-partners-intro">
        Ghana&apos;s Climate Atlas was developed through strategic cooperation on
        climate and meteorology between Ghana and Denmark.
      </p>

      <div className="panel-partners-grid">
        <a
          className="panel-partner-card"
          href="https://um.dk/ghana/en/partnership/strategic-sector-cooperation/meteorology/"
          target="_blank"
          rel="noreferrer"
        >
          <span className="panel-partner-logo panel-partner-logo-embassy">
            <img src={denmarkFlag} alt="" />
          </span>
          <span className="panel-partner-name">
            Embassy of Denmark, Ghana
            <span className="panel-partner-external" aria-hidden="true">↗</span>
          </span>
          <span className="panel-partner-description">
            Supports the 2024–2027 Ghana–Denmark cooperation on climate adaptation and meteorology.
          </span>
        </a>

        <a
          className="panel-partner-card"
          href="https://www.dmi.dk/nyheder/2026/dmi-med-til-at-skabe-ghanas-foerste-klimaatlas"
          target="_blank"
          rel="noreferrer"
        >
          <span className="panel-partner-logo panel-partner-logo-dmi">
            <img src={dmiLogo} alt="" />
            <span>DMI</span>
          </span>
          <span className="panel-partner-name">
            Danish Meteorological Institute
            <span className="panel-partner-external" aria-hidden="true">↗</span>
          </span>
          <span className="panel-partner-description">
            Climate-science partner that co-developed Ghana&apos;s first Climate Atlas with GMet.
          </span>
        </a>
      </div>
    </section>
  );
};

export default PanelPartners;
