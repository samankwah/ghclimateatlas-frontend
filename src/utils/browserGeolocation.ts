export type GeolocationFailureReason =
  | "unsupported"
  | "permission-denied"
  | "unavailable"
  | "timeout";

export type BrowserLocationResult =
  | { ok: true; latitude: number; longitude: number }
  | { ok: false; reason: GeolocationFailureReason };

const reasonForErrorCode = (code: number): GeolocationFailureReason => {
  if (code === 1) return "permission-denied";
  if (code === 3) return "timeout";
  return "unavailable";
};

export const requestBrowserLocation = (
  geolocation: Pick<Geolocation, "getCurrentPosition"> | null | undefined,
): Promise<BrowserLocationResult> => {
  if (!geolocation) {
    return Promise.resolve({ ok: false, reason: "unsupported" });
  }

  return new Promise((resolve) => {
    try {
      geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
            resolve({ ok: false, reason: "unavailable" });
            return;
          }
          resolve({ ok: true, latitude, longitude });
        },
        (error) => resolve({ ok: false, reason: reasonForErrorCode(error.code) }),
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
      );
    } catch {
      resolve({ ok: false, reason: "unavailable" });
    }
  });
};

export const GEOLOCATION_FAILURE_MESSAGES: Record<GeolocationFailureReason, string> = {
  unsupported: "Location is not supported by this browser.",
  "permission-denied": "Location permission was denied. Enable it in your browser settings and try again.",
  unavailable: "Your location is currently unavailable. Please try again.",
  timeout: "Finding your location took too long. Please try again.",
};
