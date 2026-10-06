import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import logo from "../../assets/smart-logo-gmet.webp";
import { LATEST_UPDATES_FALLBACK } from "../../data/latestUpdatesFallback";
import { useLatestUpdates } from "../../hooks/useLatestUpdates";
import type { AtlasNewsItem } from "../../types/news";
import { OverviewUpdatesSkeleton } from "../Loading/SkeletonLoaders";
import AtlasIcon from "./AtlasIcon";

const AUTOPLAY_MS = 7000;
const TILE_COUNT = 2;
const GMET_NEWS_URL = "https://www.meteo.gov.gh/news/?service=15";
const GMET_SOURCE_LABEL = "meteo.gov.gh";

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// A failed rendition falls back to the original file, then to the gradient
// alone - which is a deliberate design state, not a broken one.
const useUpdateImage = (item: AtlasNewsItem) => {
  const [imageSrc, setImageSrc] = useState(item.image_url);
  const handleImageError = () => {
    setImageSrc((current) =>
      current && current !== item.image_fallback_url ? item.image_fallback_url : null,
    );
  };
  return { handleImageError, imageSrc };
};

interface UpdateStoryProps {
  item: AtlasNewsItem;
  source: string;
}

// Date and headline at the top, the publisher at the bottom.
const UpdateStory = ({ item, source }: UpdateStoryProps) => (
  <>
    <span className="overview-update-scrim" aria-hidden="true" />
    <div className="overview-update-story">
      {item.published_label && (
        <time className="overview-update-story__date" dateTime={item.published_at ?? undefined}>
          {item.published_label}
        </time>
      )}
      <h3 className="overview-update-story__title">
        <a
          className="overview-updates-slide__link"
          href={item.url}
          rel="noopener noreferrer"
          target="_blank"
        >
          {item.title}
        </a>
      </h3>
      <p className="overview-update-story__source">
        <img alt="" aria-hidden="true" src={logo} />
        <span>{source}</span>
      </p>
    </div>
  </>
);

interface UpdateSlideProps extends UpdateStoryProps {
  index: number;
  total: number;
}

const UpdateSlide = ({ index, item, source, total }: UpdateSlideProps) => {
  const { handleImageError, imageSrc } = useUpdateImage(item);

  return (
    <article
      aria-label={`${index + 1} of ${total}`}
      aria-roledescription="slide"
      className="overview-updates-slide"
      role="group"
    >
      {imageSrc && (
        <img
          alt=""
          aria-hidden="true"
          className="overview-updates-slide__backdrop"
          decoding="async"
          loading={index === 0 ? "eager" : "lazy"}
          src={imageSrc}
          onError={handleImageError}
        />
      )}
      <UpdateStory item={item} source={source} />
    </article>
  );
};

// An up-next update beside the carousel, laid out as a photo tile.
const UpdateTile = ({ item, source }: UpdateStoryProps) => {
  const { handleImageError, imageSrc } = useUpdateImage(item);

  return (
    <article className="overview-update-tile">
      {imageSrc && (
        <img
          alt=""
          aria-hidden="true"
          className="overview-update-tile__backdrop"
          decoding="async"
          loading="lazy"
          src={imageSrc}
          onError={handleImageError}
        />
      )}
      <UpdateStory item={item} source={source} />
    </article>
  );
};

const LatestUpdatesCard = () => {
  const { data, isLoading, isError } = useLatestUpdates();
  const trackRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const isFallback = isError || (!isLoading && !data);
  // Every update rotates through the carousel, newest first.
  const items = useMemo<AtlasNewsItem[]>(
    () => (isFallback ? LATEST_UPDATES_FALLBACK : data?.items ?? []),
    [data, isFallback],
  );
  const total = items.length;

  const goTo = useCallback((index: number) => {
    const track = trackRef.current;
    if (!track) return;
    track.scrollTo({
      left: index * track.clientWidth,
      behavior: prefersReducedMotion() ? "auto" : "smooth",
    });
  }, []);

  // Keep the indicator in step with the track however the user moved it -
  // arrows, dots, a swipe, a trackpad, or the browser scrolling a focused link
  // into view.
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    let frame = 0;
    const syncActiveIndex = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        if (track.clientWidth === 0) return;
        setActiveIndex(Math.round(track.scrollLeft / track.clientWidth));
      });
    };

    track.addEventListener("scroll", syncActiveIndex, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      track.removeEventListener("scroll", syncActiveIndex);
    };
  }, [total]);

  // Auto-advance, suspended whenever the reader is likely to be engaged with it
  // and switched off entirely for reduced-motion users.
  useEffect(() => {
    if (total < 2 || isPaused || prefersReducedMotion()) return;

    const timer = window.setInterval(() => {
      const track = trackRef.current;
      if (!track || document.visibilityState === "hidden") return;
      const next = (Math.round(track.scrollLeft / track.clientWidth) + 1) % total;
      track.scrollTo({ left: next * track.clientWidth, behavior: "smooth" });
    }, AUTOPLAY_MS);

    return () => window.clearInterval(timer);
  }, [isPaused, total]);

  if (isLoading) {
    return (
      <>
        <OverviewUpdatesSkeleton />
        {Array.from({ length: TILE_COUNT }, (_, index) => (
          <div aria-hidden="true" className="overview-update-tile overview-update-tile--placeholder" key={index} />
        ))}
      </>
    );
  }

  // A refetch can return fewer items than the reader is currently looking at.
  const currentIndex = Math.min(activeIndex, Math.max(0, total - 1));
  const activeItem = items[currentIndex];
  // The tiles preview the next updates after the one on show, wrapping round,
  // so the same story is never on screen twice.
  const tileItems = Array.from(
    { length: Math.min(TILE_COUNT, total - 1) },
    (_, offset) => items[(currentIndex + offset + 1) % total],
  );
  const allNewsUrl = (!isFallback && data?.all_news_url) || GMET_NEWS_URL;
  // No "updated" time on live news; only the offline copy is labelled as such.
  const leadSource = isFallback ? `${GMET_SOURCE_LABEL} · Saved copy` : GMET_SOURCE_LABEL;

  if (total === 0) {
    return (
      <section className="overview-updates-card overview-updates-card--empty">
        <p className="overview-updates-card__eyebrow">Latest Updates</p>
        <p className="overview-updates-card__empty-message">
          Climate Atlas updates are published by the Ghana Meteorological Agency.
        </p>
        <a
          className="overview-updates-card__source"
          href={allNewsUrl}
          rel="noopener noreferrer"
          target="_blank"
        >
          View updates on meteo.gov.gh <AtlasIcon name="external" size={15} />
        </a>
      </section>
    );
  }

  return (
    <>
      <section
        aria-label="Latest Climate Atlas updates from the Ghana Meteorological Agency"
        aria-roledescription="carousel"
        className="overview-updates-card"
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
            setIsPaused(false);
          }
        }}
        onFocus={() => setIsPaused(true)}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        <div className="overview-updates-card__viewport" id="overview-updates-track" ref={trackRef}>
          {items.map((item, index) => (
            <UpdateSlide index={index} item={item} key={item.id} source={leadSource} total={total} />
          ))}
        </div>

        {total > 1 && (
          <div className="overview-updates-card__dots">
            {items.map((item, index) => (
              <button
                aria-controls="overview-updates-track"
                aria-current={index === currentIndex ? "true" : undefined}
                aria-label={`Show update ${index + 1} of ${total}`}
                className={index === currentIndex ? "is-active" : ""}
                key={item.id}
                type="button"
                onClick={() => goTo(index)}
              />
            ))}
          </div>
        )}

        {/* Announce only once rotation has stopped, so auto-advance stays quiet. */}
        <span aria-live={isPaused ? "polite" : "off"} className="visually-hidden" role="status">
          {activeItem ? `Update ${currentIndex + 1} of ${total}: ${activeItem.title}` : ""}
        </span>
      </section>

      {tileItems.map((item) => <UpdateTile item={item} key={item.id} source={GMET_SOURCE_LABEL} />)}
    </>
  );
};

export default LatestUpdatesCard;
