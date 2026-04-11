import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "cookieConsent";

type ConsentValue = "accepted" | "rejected" | "dismissed";

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [hiding, setHiding] = useState(false);

  useEffect(() => {
    // Check localStorage after mount to avoid SSR/timing issues
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      setVisible(true);
      requestAnimationFrame(() => setMounted(true));
    }
  }, []);

  const dismiss = useCallback((value: ConsentValue) => {
    localStorage.setItem(STORAGE_KEY, value);
    setHiding(true);
    setTimeout(() => setVisible(false), 300);
  }, []);

  if (!visible) return null;

  return (
    <div
      className={`cookie-consent-banner ${mounted ? "visible" : ""} ${hiding ? "hiding" : ""}`}
      role="dialog"
      aria-label="Cookie consent"
    >
      <button
        type="button"
        className="cookie-close-btn"
        onClick={() => dismiss("dismissed")}
        aria-label="Close cookie banner"
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>

      <div className="cookie-consent-header">
        <svg className="cookie-icon" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <circle cx="8" cy="9" r="1" fill="currentColor" />
          <circle cx="15" cy="7" r="1" fill="currentColor" />
          <circle cx="10" cy="14" r="1" fill="currentColor" />
          <circle cx="16" cy="13" r="1" fill="currentColor" />
          <circle cx="13" cy="17" r="0.8" fill="currentColor" />
        </svg>
        <h2 className="cookie-consent-title">We Value Your Privacy</h2>
      </div>

      <p className="cookie-consent-text">
        We use cookies to enhance your browsing experience, serve personalized
        content, and analyze our traffic. By clicking &ldquo;Accept All&rdquo;,
        you consent to our use of cookies.
      </p>

      <div className="cookie-consent-actions">
        <button
          type="button"
          className="cookie-btn cookie-btn-settings"
          onClick={() => {/* Future: open preferences modal */}}
        >
          Cookie Settings
        </button>
        <button
          type="button"
          className="cookie-btn cookie-btn-reject"
          onClick={() => dismiss("rejected")}
        >
          Reject All
        </button>
        <button
          type="button"
          className="cookie-btn cookie-btn-accept"
          onClick={() => dismiss("accepted")}
        >
          Accept All
        </button>
      </div>
    </div>
  );
}
