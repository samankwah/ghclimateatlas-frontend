import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";
import {
  canUseNonEssentialFeatures,
  getStoredCookieConsent,
  hasMadeCookieConsentDecision,
  setStoredCookieConsent,
  type CookieConsentValue,
} from "../utils/cookieConsent";

type CookieConsentContextValue = {
  consent: CookieConsentValue | null;
  hasResponded: boolean;
  hasMadeDecision: boolean;
  canUseNonEssential: boolean;
  setConsent: (value: CookieConsentValue) => void;
};

const CookieConsentContext = createContext<CookieConsentContextValue | null>(null);

export function CookieConsentProvider({ children }: PropsWithChildren) {
  const [consent, setConsentState] = useState<CookieConsentValue | null>(() =>
    getStoredCookieConsent()
  );

  const setConsent = useCallback((value: CookieConsentValue) => {
    setStoredCookieConsent(value);
    setConsentState(value);
  }, []);

  const value = useMemo<CookieConsentContextValue>(
    () => ({
      consent,
      hasResponded: consent !== null,
      hasMadeDecision: hasMadeCookieConsentDecision(consent),
      // Future analytics or embeds should read this before loading optional services.
      canUseNonEssential: canUseNonEssentialFeatures(consent),
      setConsent,
    }),
    [consent, setConsent]
  );

  return (
    <CookieConsentContext.Provider value={value}>
      {children}
    </CookieConsentContext.Provider>
  );
}

export function useCookieConsent() {
  const context = useContext(CookieConsentContext);

  if (!context) {
    throw new Error("useCookieConsent must be used within CookieConsentProvider");
  }

  return context;
}
