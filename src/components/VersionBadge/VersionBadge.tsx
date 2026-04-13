import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

const formatDisplayVersion = (raw: string): string => {
  const parts = raw.split(".");
  while (parts.length > 2 && parts[parts.length - 1] === "0") {
    parts.pop();
  }
  return parts.join(".");
};

const formatReleaseDate = (iso: string): string => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const VersionBadge: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [anchor, setAnchor] = useState<{ right: number; bottom: number } | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const popoverRef = useRef<HTMLDivElement | null>(null);

  const displayVersion = formatDisplayVersion(__APP_VERSION__);
  const releaseDate = formatReleaseDate(__APP_RELEASE_DATE__);

  useLayoutEffect(() => {
    if (!open || !buttonRef.current) return;
    const update = () => {
      if (!buttonRef.current) return;
      const rect = buttonRef.current.getBoundingClientRect();
      setAnchor({
        right: Math.max(8, window.innerWidth - rect.right),
        bottom: window.innerHeight - rect.top + 8,
      });
    };
    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (buttonRef.current?.contains(target)) return;
      if (popoverRef.current?.contains(target)) return;
      setOpen(false);
    };
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  return (
    <div className="version-badge">
      <button
        ref={buttonRef}
        type="button"
        className="version-badge-button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        aria-label={`Version ${displayVersion}`}
      >
        <span className="version-badge-label">v{displayVersion}</span>
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="16" x2="12" y2="12" />
          <line x1="12" y1="8" x2="12.01" y2="8" />
        </svg>
      </button>

      {open && anchor &&
        createPortal(
          <div
            ref={popoverRef}
            className="version-badge-popover"
            role="dialog"
            aria-label="About this version"
            style={{ right: `${anchor.right}px`, bottom: `${anchor.bottom}px` }}
          >
            <p>
              <em>Climate Atlas of Ghana</em>, version {displayVersion} ({releaseDate}) using GhKAPy climate model data
            </p>
          </div>,
          document.body,
        )}
    </div>
  );
};

export default VersionBadge;
