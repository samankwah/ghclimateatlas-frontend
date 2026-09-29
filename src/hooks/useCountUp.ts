import { useCallback, useEffect, useRef, useState } from "react";
import { prefersReducedMotion } from "../utils/prefersReducedMotion";

interface CountUpOptions {
  durationMs?: number;
}

interface CountUpResult {
  isAnimating: boolean;
  /** Attach to the element whose visibility should start the count. */
  observe: (node: HTMLElement | null) => void;
  value: number | null;
}

const DEFAULT_DURATION_MS = 900;
const VISIBILITY_THRESHOLD = 0.25;

const easeOutCubic = (progress: number): number => 1 - (1 - progress) ** 3;

/**
 * Counts a statistic up to `target` once its element scrolls into view.
 *
 * A later target (the visitor picked another district) tweens from the value
 * already on screen rather than restarting from zero, and "reduce motion"
 * settles on the target immediately.
 */
export const useCountUp = (
  target: number | null,
  { durationMs = DEFAULT_DURATION_MS }: CountUpOptions = {},
): CountUpResult => {
  const [value, setValue] = useState<number | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const displayedRef = useRef<number | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const observe = useCallback((node: HTMLElement | null) => {
    observerRef.current?.disconnect();
    observerRef.current = null;

    if (!node) return;

    if (typeof IntersectionObserver === "undefined") {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setIsVisible(true);
          observer.disconnect();
          observerRef.current = null;
        }
      },
      { threshold: VISIBILITY_THRESHOLD },
    );
    observer.observe(node);
    observerRef.current = observer;
  }, []);

  useEffect(() => () => observerRef.current?.disconnect(), []);

  useEffect(() => {
    if (target === null) {
      displayedRef.current = null;
      setValue(null);
      setIsAnimating(false);
      return;
    }

    if (!isVisible) return;

    const settle = () => {
      displayedRef.current = target;
      setValue(target);
      setIsAnimating(false);
    };

    const from = displayedRef.current ?? 0;
    if (from === target || durationMs <= 0 || prefersReducedMotion()) {
      settle();
      return;
    }

    let frame = 0;
    let start: number | null = null;
    setIsAnimating(true);

    const step = (timestamp: number) => {
      start ??= timestamp;
      const progress = Math.min(1, (timestamp - start) / durationMs);
      const current = from + (target - from) * easeOutCubic(progress);
      displayedRef.current = current;
      setValue(current);

      if (progress < 1) {
        frame = requestAnimationFrame(step);
        return;
      }
      settle();
    };

    frame = requestAnimationFrame(step);
    return () => {
      cancelAnimationFrame(frame);
      setIsAnimating(false);
    };
  }, [durationMs, isVisible, target]);

  return { isAnimating, observe, value };
};
