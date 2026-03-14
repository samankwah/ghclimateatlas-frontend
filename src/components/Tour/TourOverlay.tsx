import { useEffect, useLayoutEffect, useMemo, useState } from "react";

interface TourOverlayProps {
  onClose: () => void;
}

interface TourStep {
  id: string;
  selector: string;
  title: string;
  paragraphs: string[];
}

const TOUR_STEPS: TourStep[] = [
  {
    id: "map-variable",
    selector: '[data-tour="map-variable"]',
    title: "Map variable",
    paragraphs: [
      "Choose which climate information to display on the map using these menus.",
    ],
  },
  {
    id: "scenarios",
    selector: '[data-tour="scenarios"]',
    title: "Scenarios",
    paragraphs: [
      "Use these controls to toggle between scenarios resulting in more or less climate change based on future greenhouse gas emissions.",
      "The map can also display different time periods so you can compare the recent past with future conditions.",
      "You can click on the info icons to get more information about these greenhouse gas scenarios and time periods.",
    ],
  },
  {
    id: "map-information",
    selector: '[data-tour="map-information"]',
    title: "Map information",
    paragraphs: [
      "As you change the various map options, the title bar at the top keeps track of what you've chosen, so you always know what you're looking at.",
      "You can also get more information about what the map is showing. Click on the large info icon to get detailed explanations about the map you're exploring.",
    ],
  },
  {
    id: "stories",
    selector: '[data-tour="stories"]',
    title: "STORIES",
    paragraphs: [
      "Use the Stories control to turn local climate stories on or off across the map.",
      "These story markers open place-based examples, local impacts, and videos that help explain how climate change is affecting communities.",
    ],
  },
  {
    id: "share-map",
    selector: '[data-tour="share-map"]',
    title: "Share the map",
    paragraphs: [
      "You can share the map display on social media or by email.",
      "The map will get shared exactly as it looks. If you are zoomed in on a specific location, or if you have a sidebar open showing details about a town or region, that display is what others will see when you share.",
    ],
  },
];

type RectState = {
  top: number;
  left: number;
  width: number;
  height: number;
} | null;

const TourOverlay: React.FC<TourOverlayProps> = ({ onClose }) => {
  const [stepIndex, setStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<RectState>(null);

  const step = TOUR_STEPS[stepIndex];
  const isLastStep = stepIndex === TOUR_STEPS.length - 1;

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

  useLayoutEffect(() => {
    const updateRect = () => {
      const element = document.querySelector(step.selector) as HTMLElement | null;
      if (!element) {
        setTargetRect(null);
        return;
      }

      element.scrollIntoView({ block: "nearest", inline: "nearest" });

      const rect = element.getBoundingClientRect();
      const padding = 12;

      setTargetRect({
        top: Math.max(0, rect.top - padding),
        left: Math.max(0, rect.left - padding),
        width: rect.width + padding * 2,
        height: rect.height + padding * 2,
      });
    };

    updateRect();

    const frame = window.requestAnimationFrame(updateRect);
    window.addEventListener("resize", updateRect);
    window.addEventListener("scroll", updateRect, true);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", updateRect);
      window.removeEventListener("scroll", updateRect, true);
    };
  }, [step]);

  const cardPosition = useMemo(() => {
    const viewportWidth = typeof window !== "undefined" ? window.innerWidth : 1280;
    const viewportHeight = typeof window !== "undefined" ? window.innerHeight : 720;
    const cardWidth = Math.min(430, viewportWidth - 32);
    const cardHeightGuess = step.id === "scenarios" ? 250 : step.id === "share-map" ? 220 : 190;

    if (!targetRect) {
      return {
        top: Math.max(96, viewportHeight - cardHeightGuess - 32),
        left: Math.max(16, (viewportWidth - cardWidth) / 2),
        width: cardWidth,
      };
    }

    if (step.id === "map-variable") {
      return {
        top: Math.max(16, targetRect.top - 64),
        left: Math.min(
          Math.max(16, targetRect.left + targetRect.width / 2 - cardWidth / 2),
          viewportWidth - cardWidth - 16
        ),
        width: cardWidth,
      };
    }

    if (step.id === "scenarios") {
      return {
        top: Math.max(16, targetRect.top - cardHeightGuess - 12),
        left: Math.min(
          Math.max(16, targetRect.left + targetRect.width / 2 - cardWidth / 2),
          viewportWidth - cardWidth - 16
        ),
        width: cardWidth,
      };
    }

    const spaceAbove = targetRect.top;
    const spaceBelow = viewportHeight - (targetRect.top + targetRect.height);
    const placeAbove = spaceAbove > cardHeightGuess + 24 || spaceAbove > spaceBelow;

    const top = placeAbove
      ? Math.max(16, targetRect.top - cardHeightGuess - 18)
      : Math.min(viewportHeight - cardHeightGuess - 16, targetRect.top + targetRect.height + 18);

    let left = targetRect.left + targetRect.width / 2 - cardWidth / 2;

    if (step.id === "map-information") {
      left = targetRect.left + targetRect.width + 22;
    }

    if (step.id === "share-map") {
      left = targetRect.left + targetRect.width - cardWidth;
    }

    return {
      top,
      left: Math.min(Math.max(16, left), viewportWidth - cardWidth - 16),
      width: cardWidth,
    };
  }, [step.id, targetRect]);

  return (
    <div className="tour-overlay" role="presentation">
      <div
        className="tour-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="tour-title"
        style={{
          top: `${cardPosition.top}px`,
          left: `${cardPosition.left}px`,
          width: `${cardPosition.width}px`,
        }}
      >
        <div className="tour-card-body">
          <h3 id="tour-title">{step.title}</h3>
          {step.paragraphs.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>

        <div className="tour-card-footer">
          <button
            className="tour-action-btn tour-action-next"
            onClick={() => {
              if (isLastStep) {
                onClose();
                return;
              }
              setStepIndex((current) => current + 1);
            }}
          >
            <span className="tour-action-icon">?</span>
            <span>{isLastStep ? "DONE" : "NEXT"}</span>
          </button>

          <button className="tour-action-btn tour-action-cancel" onClick={onClose}>
            <span className="tour-action-close">×</span>
            <span>{isLastStep ? "CLOSE" : "CANCEL"}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default TourOverlay;
