import { useState, useEffect, useCallback } from "react";
import { useCookieConsent } from "../../hooks/useCookieConsent";
import type { CookieConsentValue } from "../../utils/cookieConsent";

export default function CookieConsent() {
  const { hasResponded, setConsent } = useCookieConsent();
  const [visible, setVisible] = useState(!hasResponded);
  const [mounted, setMounted] = useState(false);
  const [hiding, setHiding] = useState(false);

  useEffect(() => {
    if (!hasResponded) {
      setHiding(false);
      setMounted(false);
      setVisible(true);
      requestAnimationFrame(() => setMounted(true));
      return;
    }

    if (!hiding) {
      setMounted(false);
      setVisible(false);
    }
  }, [hasResponded, hiding]);

  const dismiss = useCallback((value: CookieConsentValue) => {
    setHiding(true);
    setConsent(value);
    setTimeout(() => {
      setMounted(false);
      setVisible(false);
    }, 300);
  }, [setConsent]);

  if (!visible) return null;

  return (
    <div
      className={`cookie-consent-banner ${mounted ? "visible" : ""} ${hiding ? "hiding" : ""}`}
      role="dialog"
      aria-label="Cookie consent"
    >
      <div className="cookie-consent-copy">
        <div className="cookie-consent-header">
          <svg className="cookie-icon" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <circle cx="8" cy="9" r="1" fill="currentColor" />
            <circle cx="15" cy="7" r="1" fill="currentColor" />
            <circle cx="10" cy="14" r="1" fill="currentColor" />
            <circle cx="16" cy="13" r="1" fill="currentColor" />
            <circle cx="13" cy="17" r="0.8" fill="currentColor" />
          </svg>
          <h2 className="cookie-consent-title">Cookies</h2>
        </div>

        <p className="cookie-consent-text">
          We use cookies to improve your browsing experience and analyze
          traffic. Select &ldquo;Accept All&rdquo; to allow optional cookies.
        </p>
      </div>

      <div className="cookie-consent-actions">
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
