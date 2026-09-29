// Points the Overview highlights at the visitor's own district.
//
// There is no visible control on the page: the guess happens once per browser
// session, only when the visitor has not already pinned a district in the URL,
// and it silently leaves the Accra default in place whenever it cannot resolve
// a location. A manual picker lives in the Map Viewer.

import { useEffect, useRef } from "react";
import type { DistrictFeatureCollection } from "../types/climate";
import { requestBrowserLocation } from "../utils/browserGeolocation";
import { resolveDistrictLocation } from "../utils/districtLocation";
import { navigate, overviewQueryString } from "../utils/publicRouting";

const AUTO_LOCATE_STORAGE_KEY = "overviewAutoLocate";

const readAutoLocateMarker = (): boolean => {
  try {
    return window.sessionStorage.getItem(AUTO_LOCATE_STORAGE_KEY) === "done";
  } catch {
    return true;
  }
};

const writeAutoLocateMarker = (): void => {
  try {
    window.sessionStorage.setItem(AUTO_LOCATE_STORAGE_KEY, "done");
  } catch {
    // A blocked storage API only costs us the one-shot guard below.
  }
};

const geolocationPermissionDenied = async (): Promise<boolean> => {
  try {
    const permissions = navigator.permissions;
    if (!permissions?.query) return false;
    const status = await permissions.query({ name: "geolocation" as PermissionName });
    return status.state === "denied";
  } catch {
    return false;
  }
};

export const useOverviewAutoLocate = (
  featureCollection: DistrictFeatureCollection | undefined,
  hasExplicitDistrict: boolean,
): void => {
  const attemptedRef = useRef(false);
  const districtsReady = Boolean(featureCollection?.features.length);

  useEffect(() => {
    if (attemptedRef.current || hasExplicitDistrict || !districtsReady) return;
    attemptedRef.current = true;

    if (readAutoLocateMarker()) return;
    writeAutoLocateMarker();

    let cancelled = false;
    void (async () => {
      if (await geolocationPermissionDenied()) return;

      const geolocation = typeof navigator === "undefined" ? undefined : navigator.geolocation;
      const browserLocation = await requestBrowserLocation(geolocation);
      if (cancelled || !browserLocation.ok) return;

      const { latitude, longitude } = browserLocation;
      const resolution = resolveDistrictLocation([longitude, latitude], featureCollection);
      if (cancelled || !resolution) return;

      navigate(`/overview?${overviewQueryString(resolution.district.properties.id)}`, { replace: true });
    })();

    return () => {
      cancelled = true;
    };
  }, [districtsReady, featureCollection, hasExplicitDistrict]);
};
