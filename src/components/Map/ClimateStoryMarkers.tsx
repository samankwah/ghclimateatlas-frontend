import { useState } from "react";
import { createPortal } from "react-dom";
import { Marker } from "react-leaflet";
import L from "leaflet";
import { CLIMATE_STORIES } from "../../data/climateStories";
import type { ClimateStory } from "../../types/story";

interface ClimateStoryMarkersProps {
  visible: boolean;
}

const CATEGORY_COLORS: Record<string, string> = {
  "Urban Heat": "#ef4444",
  "Coastal Erosion": "#3b82f6",
  Drought: "#f59e0b",
  Flooding: "#6366f1",
  "Water Scarcity": "#06b6d4",
  "Food Security": "#22c55e",
  "Sea Level Rise": "#0ea5e9",
  "Industrial Heat": "#f97316",
  Fisheries: "#14b8a6",
};

function getEmbeddedVideoUrl(videoUrl: string) {
  try {
    const url = new URL(videoUrl);
    const host = url.hostname.replace(/^www\./, "");

    if (host === "youtu.be") {
      const videoId = url.pathname.slice(1);
      return `https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1`;
    }

    if (host === "youtube.com" || host === "m.youtube.com") {
      if (url.pathname === "/watch") {
        const videoId = url.searchParams.get("v");
        if (videoId) {
          return `https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1`;
        }
      }

      if (url.pathname.startsWith("/embed/")) {
        const videoId = url.pathname.split("/embed/")[1];
        if (videoId) {
          return `https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1`;
        }
      }
    }

    if (host === "dailymotion.com") {
      const videoMatch = url.pathname.match(/\/video\/([^/?]+)/);
      if (videoMatch?.[1]) {
        return `https://www.dailymotion.com/embed/video/${videoMatch[1]}`;
      }
    }

    if (host === "dai.ly") {
      const videoId = url.pathname.slice(1);
      if (videoId) {
        return `https://www.dailymotion.com/embed/video/${videoId}`;
      }
    }
  } catch {
    return videoUrl;
  }

  return videoUrl;
}

function createPlayIcon(category: string) {
  const iconColor = CATEGORY_COLORS[category] || "#444";
  return L.divIcon({
    className: "",
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -17],
    html: `<div class="story-marker">
      <svg viewBox="0 0 24 24" width="22" height="22" fill="${iconColor}">
        <polygon points="8,5 19,12 8,19" />
      </svg>
    </div>`,
  });
}

const ClimateStoryMarkers: React.FC<ClimateStoryMarkersProps> = ({
  visible,
}) => {
  const [activeStory, setActiveStory] = useState<ClimateStory | null>(null);

  if (!visible) return null;

  return (
    <>
      {CLIMATE_STORIES.map((story) => {
        return (
          <Marker
            key={story.id}
            position={[story.lat, story.lng]}
            icon={createPlayIcon(story.category)}
            zIndexOffset={1000}
            eventHandlers={{ click: () => setActiveStory(story) }}
          />
        );
      })}

      {activeStory && createPortal(
        <div className="story-modal-overlay" onClick={() => setActiveStory(null)}>
          <div className="story-modal-card" onClick={(event) => event.stopPropagation()}>
            <button
              type="button"
              className="story-modal-close"
              aria-label="Close story"
              onClick={() => setActiveStory(null)}
            >
              ×
            </button>
            <div className="story-popup-content">
              <h2
                className="story-popup-city"
                style={{ color: CATEGORY_COLORS[activeStory.category] || "#e94560" }}
              >
                {activeStory.city}
              </h2>
              <h3 className="story-popup-title">{activeStory.title}</h3>
              <p className="story-popup-description">{activeStory.description}</p>
              <div className="story-popup-video">
                <iframe
                  src={getEmbeddedVideoUrl(activeStory.videoUrl)}
                  title={activeStory.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  referrerPolicy="strict-origin-when-cross-origin"
                />
              </div>
              <p className="story-popup-caption-hint">
                Use the captions button at the bottom of the video player to
                turn captions on or off.
              </p>
              {activeStory.externalUrl && (
                <a
                  href={activeStory.externalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="story-popup-link"
                >
                  Learn More &rarr;
                </a>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};

export default ClimateStoryMarkers;
