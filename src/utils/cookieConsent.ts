export const COOKIE_CONSENT_STORAGE_KEY = "cookieConsent";

export type CookieConsentValue = "accepted" | "rejected" | "dismissed";

const VALID_COOKIE_CONSENT_VALUES = new Set<CookieConsentValue>([
  "accepted",
  "rejected",
  "dismissed",
]);

export function getStoredCookieConsent(): CookieConsentValue | null {
  if (typeof window === "undefined") {
    return null;
  }

  const stored = window.localStorage.getItem(COOKIE_CONSENT_STORAGE_KEY);
  if (!stored || !VALID_COOKIE_CONSENT_VALUES.has(stored as CookieConsentValue)) {
    return null;
  }

  return stored as CookieConsentValue;
}

export function setStoredCookieConsent(value: CookieConsentValue) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(COOKIE_CONSENT_STORAGE_KEY, value);
}

export function hasMadeCookieConsentDecision(value: CookieConsentValue | null): boolean {
  return value === "accepted" || value === "rejected";
}

export function canUseNonEssentialFeatures(value: CookieConsentValue | null): boolean {
  return value === "accepted";
}
