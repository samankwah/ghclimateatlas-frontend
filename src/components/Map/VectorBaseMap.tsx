// Basemap layer: fast raster tiles first, upgraded to OpenFreeMap Positron
// vector tiles once they are ready.
//
// Why two layers rather than just the vector one: MapLibre cannot draw anything
// until it has walked a serial dependency chain (style -> TileJSON -> sprite ->
// glyphs -> tiles). From Ghana each hop is a ~500ms round trip, so the basemap
// took seconds to appear. Raster tiles need a single request, no style and no
// WebGL, so they paint almost immediately and give the user a map to look at
// while the vector style resolves behind them.
//
// maplibre-gl-leaflet is an imperative Leaflet plugin rather than a React
// component, so it is mounted through useMap() in an effect, following the same
// pattern as InterpolatedLayer.
//
// The plugin defaults to `pane: "tilePane"` and `interactive: false`, so the
// MapLibre canvas sits below every overlay pane and never registers its own
// mouse/keyboard handlers -- district click and hover handling stays with Leaflet.

import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import "@maplibre/maplibre-gl-leaflet";
import "maplibre-gl/dist/maplibre-gl.css";
import {
  BASEMAP_ATTRIBUTION,
  BASEMAP_READY_TIMEOUT_MS,
  FALLBACK_RASTER_ATTRIBUTION,
  FALLBACK_RASTER_MAX_ZOOM,
  FALLBACK_RASTER_URL,
  OPENFREEMAP_POSITRON_STYLE,
  VECTOR_STYLE_LOAD_TIMEOUT_MS,
} from "../../constants/basemap";

/** Crossfade duration when the vector basemap takes over from the raster one. */
const UPGRADE_FADE_MS = 260;

interface VectorBaseMapProps {
  /**
   * Fired once, as soon as *some* basemap has painted (raster or vector,
   * whichever lands first). Used to dismiss the map loading skeleton.
   */
  onReady?: () => void;
}

const VectorBaseMap: React.FC<VectorBaseMapProps> = ({ onReady }) => {
  const map = useMap();

  // Kept in a ref so a changing callback identity never re-runs the effect and
  // tears the basemap down mid-load.
  const onReadyRef = useRef<(() => void) | undefined>(undefined);
  useEffect(() => {
    onReadyRef.current = onReady;
  }, [onReady]);

  useEffect(() => {
    let vectorLayer: L.MaplibreGL | null = null;
    let rasterLayer: L.TileLayer | null = null;
    let vectorReady = false;
    let notified = false;
    let disposed = false;
    let styleTimeoutId: ReturnType<typeof setTimeout> | undefined;
    let readyTimeoutId: ReturnType<typeof setTimeout> | undefined = undefined;
    let fadeTimeoutId: ReturnType<typeof setTimeout> | undefined;

    const notifyReady = () => {
      if (notified || disposed) return;
      notified = true;
      if (readyTimeoutId) clearTimeout(readyTimeoutId);
      onReadyRef.current?.();
    };

    // --- 1. Raster basemap, painted as fast as the network allows -----------
    rasterLayer = L.tileLayer(FALLBACK_RASTER_URL, {
      attribution: FALLBACK_RASTER_ATTRIBUTION,
      maxZoom: FALLBACK_RASTER_MAX_ZOOM,
      // Keep rendering the zoom-16 tiles when zoomed in further.
      maxNativeZoom: FALLBACK_RASTER_MAX_ZOOM,
      pane: "tilePane",
    });
    // Leaflet fires `load` once every visible tile has painted.
    rasterLayer.once("load", notifyReady);
    rasterLayer.addTo(map);

    // Never let the skeleton outlive this, even with no network at all.
    readyTimeoutId = setTimeout(notifyReady, BASEMAP_READY_TIMEOUT_MS);

    const removeRaster = () => {
      if (!rasterLayer) return;
      const stale = rasterLayer;
      rasterLayer = null;
      map.removeLayer(stale);
    };

    // Vector unavailable: keep the raster basemap as the permanent one.
    const keepRasterOnly = (reason: string) => {
      if (vectorReady || disposed) return;
      console.warn(`[basemap] vector style unavailable (${reason}); staying on raster tiles`);
      if (styleTimeoutId) clearTimeout(styleTimeoutId);
      if (vectorLayer) {
        const stale = vectorLayer;
        vectorLayer = null;
        try {
          map.removeLayer(stale);
        } catch {
          // Layer was never fully attached; nothing to detach.
        }
      }
      notifyReady();
    };

    // --- 2. Vector basemap, loaded in parallel and faded in on top ----------
    try {
      vectorLayer = L.maplibreGL({
        style: OPENFREEMAP_POSITRON_STYLE,
        // maplibre-gl-leaflet reads customAttribution off this option and pushes
        // it into Leaflet's attribution control; it forces the MapLibre map's own
        // attribution control off regardless.
        attributionControl: { customAttribution: BASEMAP_ATTRIBUTION },
      });
      vectorLayer.addTo(map);

      // The plugin appends its container to tilePane after the raster layer's,
      // so it stacks above. Held transparent until the style is drawn, so the
      // raster tiles show through instead of a blank canvas.
      const container = vectorLayer.getContainer();
      container.style.opacity = "0";
      container.style.transition = `opacity ${UPGRADE_FADE_MS}ms ease-in-out`;

      // getMaplibreMap() only exists once the layer has been added.
      const glMap = vectorLayer.getMaplibreMap();

      glMap.on("load", () => {
        vectorReady = true;
        if (styleTimeoutId) clearTimeout(styleTimeoutId);
        if (disposed) return;

        container.style.opacity = "1";
        notifyReady();
        // Drop the raster only once the vector layer has faded fully in, so no
        // frame is left with an empty basemap.
        fadeTimeoutId = setTimeout(removeRaster, UPGRADE_FADE_MS);
      });

      // Tile-level errors after the style loads are transient and ignorable.
      // An error before `load` means the style itself never arrived.
      glMap.on("error", (event) => {
        if (vectorReady) return;
        keepRasterOnly(event?.error?.message ?? "style error");
      });

      styleTimeoutId = setTimeout(() => {
        keepRasterOnly("load timed out");
      }, VECTOR_STYLE_LOAD_TIMEOUT_MS);
    } catch (error) {
      // Thrown when WebGL is unavailable (older hardware, GPU blocklist,
      // software rendering disabled). The raster basemap is already on the map,
      // so there is nothing to fall back to -- just clean up the vector attempt.
      keepRasterOnly(error instanceof Error ? error.message : "WebGL unavailable");
    }

    return () => {
      disposed = true;
      if (styleTimeoutId) clearTimeout(styleTimeoutId);
      if (readyTimeoutId) clearTimeout(readyTimeoutId);
      if (fadeTimeoutId) clearTimeout(fadeTimeoutId);
      if (vectorLayer) map.removeLayer(vectorLayer);
      if (rasterLayer) map.removeLayer(rasterLayer);
    };
  }, [map]);

  return null;
};

export default VectorBaseMap;
