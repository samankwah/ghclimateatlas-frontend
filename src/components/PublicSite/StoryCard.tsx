import { useState } from "react";
import type { ClimateStory } from "../../types/story";
import { caseStudyPath } from "../../utils/publicRouting";
import { getHostedVideoThumbnail } from "../../utils/storyMedia";
import { StoryMediaSkeleton } from "../Loading/SkeletonLoaders";
import AtlasIcon from "./AtlasIcon";
import RouteLink from "./RouteLink";

interface StoryCardProps {
  story: ClimateStory;
  onWatch: (story: ClimateStory, trigger: HTMLButtonElement) => void;
}

const StoryCard = ({ story, onWatch }: StoryCardProps) => {
  const thumbnailUrl = getHostedVideoThumbnail(story.videoUrl);
  const [mediaLoaded, setMediaLoaded] = useState(!story.videoSrc && !thumbnailUrl);
  const finishLoadingMedia = () => setMediaLoaded(true);

  return (
    <li className="story-card" data-story-id={story.id}>
      <article>
        <button
          aria-label={`Watch ${story.title}`}
          className="story-card__media"
          type="button"
          onClick={(event) => onWatch(story, event.currentTarget)}
        >
          {!mediaLoaded && <StoryMediaSkeleton />}
          {story.videoSrc ? (
            <video
              aria-hidden="true"
              className="story-card__thumbnail"
              muted
              playsInline
              preload="metadata"
              src={`${story.videoSrc}#t=0.1`}
              tabIndex={-1}
              onLoadedData={finishLoadingMedia}
              onError={(event) => {
                event.currentTarget.hidden = true;
                finishLoadingMedia();
              }}
            />
          ) : thumbnailUrl ? (
            <img
              alt=""
              className="story-card__thumbnail"
              decoding="async"
              loading="lazy"
              src={thumbnailUrl}
              onLoad={finishLoadingMedia}
              onError={(event) => {
                event.currentTarget.hidden = true;
                finishLoadingMedia();
              }}
            />
          ) : null}
          <span className="story-card__media-overlay" />
          <span className="story-card__watch">
            <span className="story-card__play" aria-hidden="true">
              <AtlasIcon name="play" size={18} />
            </span>
            <span>Watch video</span>
          </span>
        </button>

        <div className="story-card__content">
          <p className="story-card__meta">
            <span>{story.category}</span>
            <span aria-hidden="true">·</span>
            <span>{story.city}</span>
          </p>
          <h2>{story.title}</h2>
          <p className="story-card__description">{story.description}</p>
          <RouteLink className="story-card__details" to={caseStudyPath(story.id)}>
            View case study <AtlasIcon name="arrow" size={17} />
          </RouteLink>
        </div>
      </article>
    </li>
  );
};

export default StoryCard;
