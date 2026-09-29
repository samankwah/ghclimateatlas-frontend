import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import type { ClimateStory } from "../../types/story";
import { caseStudyPath } from "../../utils/publicRouting";
import { getEmbeddedVideoUrl } from "../../utils/storyMedia";
import AtlasIcon from "./AtlasIcon";
import RouteLink from "./RouteLink";

interface StoryVideoModalProps {
  story: ClimateStory;
  onClose: () => void;
  returnFocusTo?: HTMLElement | null;
  showDetailsLink?: boolean;
}

const StoryVideoModal = ({
  story,
  onClose,
  returnFocusTo,
  showDetailsLink = true,
}: StoryVideoModalProps) => {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const embeddedVideoUrl = getEmbeddedVideoUrl(story.videoUrl, true);

  useEffect(() => {
    const dialog = dialogRef.current;
    const focusTarget = returnFocusTo ?? (
      document.activeElement instanceof HTMLElement ? document.activeElement : null
    );

    document.body.classList.add("story-video-is-open");
    if (dialog && !dialog.open) dialog.showModal();
    requestAnimationFrame(() => closeButtonRef.current?.focus());

    return () => {
      document.body.classList.remove("story-video-is-open");
      window.setTimeout(() => focusTarget?.focus({ preventScroll: true }), 0);
    };
  }, [returnFocusTo]);

  return createPortal(
    <dialog
      aria-labelledby={`story-video-title-${story.id}`}
      className="story-video-dialog"
      ref={dialogRef}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === dialogRef.current) onClose();
      }}
    >
      <div className="story-video-dialog__surface">
        <header className="story-video-dialog__header">
          <div>
            <span>{story.category}</span>
            <span aria-hidden="true">·</span>
            <span>{story.city}</span>
          </div>
          <button
            aria-label={`Close ${story.title} video`}
            className="story-video-dialog__close"
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
          >
            <AtlasIcon name="close" size={20} />
          </button>
        </header>

        <div className="story-video-dialog__player">
          {story.videoSrc ? (
            <video
              autoPlay
              controls
              playsInline
              preload="metadata"
              src={story.videoSrc}
            >
              Your browser does not support HTML video. You can still read the case study below.
            </video>
          ) : embeddedVideoUrl ? (
            <iframe
              allow="autoplay; fullscreen; picture-in-picture; web-share"
              allowFullScreen
              referrerPolicy="strict-origin-when-cross-origin"
              src={embeddedVideoUrl}
              title={`${story.title} video`}
            />
          ) : (
            <div className="story-video-dialog__unavailable" role="status">
              <AtlasIcon name="play" size={30} />
              <p>This video is currently unavailable.</p>
            </div>
          )}
        </div>

        <div className="story-video-dialog__footer">
          <div>
            <h2 id={`story-video-title-${story.id}`}>{story.title}</h2>
            <p>{story.description}</p>
          </div>
          {showDetailsLink && (
            <RouteLink
              className="story-video-dialog__details"
              to={caseStudyPath(story.id)}
              onClick={onClose}
            >
              View case study <AtlasIcon name="arrow" size={17} />
            </RouteLink>
          )}
        </div>
      </div>
    </dialog>,
    document.body,
  );
};

export default StoryVideoModal;
