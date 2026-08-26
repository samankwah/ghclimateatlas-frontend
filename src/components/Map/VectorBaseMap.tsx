// Vector basemap layer (OpenFreeMap Positron) with a raster fallback.
//
// maplibre-gl-leaflet is an imperative Leaflet plugin rather than a React
// component, so it is mounted through useMap() in an effect, following the same
// pattern as InterpolatedLayer.
//
// The plugin defaults to `pane: "tilePane"` and `interactive: false`, so the
// MapLibre canvas sits below every overlay pane and never registers its own
// mouse/keyboard handlers -- district click and hover handling stays with Leaflet.

import { useEffect } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import "@maplibre/maplibre-gl-leaflet";
import "maplibre-gl/dist/maplibre-gl.css";
import {
  BASEMAP_ATTRIBUTION,
  FALLBACK_RASTER_ATTRIBUTION,
  FALLBACK_RASTER_MAX_ZOOM,
  FALLBACK_RASTER_URL,
  OPENFREEMAP_POSITRON_STYLE,
  VECTOR_STYLE_LOAD_TIMEOUT_MS,
} from "../../constants/basemap";

const VectorBaseMap: React.FC = () => {
  const map = useMap();

  useEffect(() => {
    let vectorLayer: L.MaplibreGL | null = null;
    let rasterLayer: L.TileLayer | null = null;
    let styleLoaded = false;
    let settled = false;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    // Swap to raster tiles. Runs at most once, and never after cleanup.
    const switchToRasterFallback = (reason: string) => {
      if (settled) return;
      settled = true;
      console.warn(`[basemap] vector style unavailable (${reason}); using raster fallback`);

      if (vectorLayer) {
        map.removeLayer(vectorLayer);
        vectorLayer = null;
      }

      rasterLayer = L.tileLayer(FALLBACK_RASTER_URL, {
        attribution: FALLBACK_RASTER_ATTRIBUTION,
        maxZoom: FALLBACK_RASTER_MAX_ZOOM,
        // Keep rendering the zoom-16 tiles when zoomed in further.
        maxNativeZoom: FALLBACK_RASTER_MAX_ZOOM,
        pane: "tilePane",
      });
      rasterLayer.addTo(map);
    };

    try {
      vectorLayer = L.maplibreGL({
        style: OPENFREEMAP_POSITRON_STYLE,
        // maplibre-gl-leaflet reads customAttribution off this option and pushes
        // it into Leaflet's attribution control; it forces the MapLibre map's own
        // attribution control off regardless.
        attributionControl: { customAttribution: BASEMAP_ATTRIBUTION },
      });
      vectorLayer.addTo(map);

      // getMaplibreMap() only exists once the layer has been added.
      const glMap = vectorLayer.getMaplibreMap();

      glMap.on("load", () => {
        styleLoaded = true;
        settled = true;
        if (timeoutId) clearTimeout(timeoutId);
      });

      // Tile-level errors after the style loads are transient and ignorable.
      // An error before `load` means the style itself never arrived.
      glMap.on("error", (event) => {
        if (styleLoaded) return;
        switchToRasterFallback(event?.error?.message ?? "style error");
      });

      timeoutId = setTimeout(() => {
        if (!styleLoaded) switchToRasterFallback("load timed out");
      }, VECTOR_STYLE_LOAD_TIMEOUT_MS);
    } catch (error) {
      // Thrown when WebGL is unavailable (older hardware, GPU blocklist,
      // software rendering disabled). If the throw came from addTo(), the plugin
      // may already have attached its container, so detach it before falling back.
      if (vectorLayer) {
        try {
          map.removeLayer(vectorLayer);
        } catch {
          // Layer was never fully attached; nothing to detach.
        }
        vectorLayer = null;
      }
      switchToRasterFallback(error instanceof Error ? error.message : "WebGL unavailable");
    }

    return () => {
      settled = true;
      if (timeoutId) clearTimeout(timeoutId);
      if (vectorLayer) map.removeLayer(vectorLayer);
      if (rasterLayer) map.removeLayer(rasterLayer);
    };
  }, [map]);

  return null;
};

export default VectorBaseMap;
