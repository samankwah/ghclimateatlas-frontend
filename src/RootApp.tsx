import { lazy, Suspense, useEffect, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import MapSkeleton from "./components/Map/MapSkeleton";
import PublicSite from "./components/PublicSite/PublicSite";
import {
  migrateLegacyMapLocation,
  NAVIGATION_EVENT,
  normalizePathname,
  replaceCurrentHistoryUrl,
} from "./utils/publicRouting";

const MapApp = lazy(() => import("./App"));

interface BrowserLocation {
  pathname: string;
  search: string;
  hash: string;
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

const readLocation = (): BrowserLocation => {
  const legacyDestination = migrateLegacyMapLocation(
    window.location.pathname,
    window.location.search,
    window.location.hash,
  );
  if (legacyDestination) {
    replaceCurrentHistoryUrl(legacyDestination);
  }

  return {
    pathname: normalizePathname(window.location.pathname),
    search: window.location.search,
    hash: window.location.hash,
  };
};

function RootApp() {
  const [location, setLocation] = useState<BrowserLocation>(readLocation);
  const isMap = location.pathname === "/map";

  useEffect(() => {
    const updateLocation = () => setLocation(readLocation());
    window.addEventListener("popstate", updateLocation);
    window.addEventListener(NAVIGATION_EVENT, updateLocation);
    return () => {
      window.removeEventListener("popstate", updateLocation);
      window.removeEventListener(NAVIGATION_EVENT, updateLocation);
    };
  }, []);

  useEffect(() => {
    document.body.classList.toggle("map-route", isMap);
    document.body.classList.toggle("public-route", !isMap);
    if (!isMap) window.scrollTo({ top: 0, behavior: "auto" });
  }, [isMap, location.pathname]);

  return (
    <QueryClientProvider client={queryClient}>
      {/* Map fallback: the same skeleton the map shows until its data arrives, so
          loading reads as one continuous screen rather than a text page first. */}
      {isMap ? (
      <Suspense fallback={<div className="route-loader"><MapSkeleton /></div>}>
        <MapApp />
      </Suspense>
      ) : (
        <PublicSite key={location.pathname} pathname={location.pathname} search={location.search} />
      )}
    </QueryClientProvider>
  );
}

export default RootApp;
