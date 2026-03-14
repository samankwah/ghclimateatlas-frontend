import { useEffect } from "react";

interface HelpOverlayProps {
  onClose: () => void;
  onStartTour: () => void;
}

const HELP_SECTIONS = [
  {
    title: "1. Choose climate information",
    body: [
      "Select a climate category from the controls at the bottom of the map, then pick the specific indicator you want to display across Ghana.",
      "You can also switch between the recent baseline and future periods, and compare lower-carbon and higher-carbon pathways to see how outcomes change.",
    ],
  },
  {
    title: "2. Click on a district",
    body: [
      "Once the map loads data for the selected indicator, period, and scenario, click any district to inspect its detailed climate profile.",
      "The side panel shows values, charts, and supporting context for that district so you can compare recent conditions with projected futures.",
    ],
  },
  {
    title: "3. Watch local stories",
    body: [
      "Use the story markers on the map to open short climate stories tied to real places and local impacts across Ghana.",
    ],
  },
  {
    title: "? More help",
    body: [
      "Use the search box to jump to a district quickly, and use the map layer controls to show cities, water bodies, stories, or the reference grid.",
      "Open this help panel any time from the navbar HELP button or the small info badge beside MAP.",
    ],
  },
];

const HelpOverlay: React.FC<HelpOverlayProps> = ({ onClose, onStartTour }) => {
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div className="help-overlay" onClick={onClose} role="presentation">
      <div
        className="help-overlay-panel"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Help"
      >
        <div className="help-overlay-surface" />

        <div className="help-overlay-content">
          <button className="help-overlay-close" onClick={onClose} aria-label="Close help">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>

          <div className="help-overlay-body">
            {HELP_SECTIONS.map((section) => (
              <section className="help-section" key={section.title}>
                <h3>{section.title}</h3>
                {section.body.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </section>
            ))}
          </div>

          <div className="help-overlay-footer">
            <button className="help-footer-btn help-footer-btn-primary" onClick={onStartTour}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <polygon points="10 8 16 12 10 16 10 8" />
              </svg>
              <span>TOUR</span>
            </button>

            <button className="help-footer-btn help-footer-btn-secondary" onClick={onClose}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
              <span>CANCEL</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HelpOverlay;
