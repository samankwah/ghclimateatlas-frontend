// Basemap provider configuration.
//
// The atlas previously used CARTO's "light_all" raster basemap. CARTO retired
// anonymous access to those tiles, and unauthenticated requests are now served
// with an "API KEY REQUIRED" watermark burned into every tile image, so the
// basemap had to move to a provider that does not require a key.
//
// Primary: OpenFreeMap's "positron" vector style. Positron is the open-sourced
// lineage of the CARTO Light style, so the pale-grey look the atlas was designed
// around is preserved. OpenFreeMap is free for public and commercial use with no
// API key and no rate limits.
//
// Fallback: Esri's World Light Gray Base raster tiles, used only when the vector
// style fails to load (provider outage, blocked host, or no WebGL support).
//
// Changing provider should only require editing this file.

/** OpenFreeMap Positron vector style (no API key required). */
export const OPENFREEMAP_POSITRON_STYLE = "https://tiles.openfreemap.org/styles/positron";

/**
 * Attribution for the primary vector basemap.
 *
 * OpenFreeMap serves OpenMapTiles-schema tiles built from OpenStreetMap data,
 * so all three need crediting. Rendered into Leaflet's attribution control by
 * maplibre-gl-leaflet via its `attributionControl.customAttribution` option.
 */
export const BASEMAP_ATTRIBUTION =
  '&copy; <a href="https://openfreemap.org" target="_blank" rel="noopener noreferrer">OpenFreeMap</a> ' +
  '&copy; <a href="https://www.openmaptiles.org/" target="_blank" rel="noopener noreferrer">OpenMapTiles</a> ' +
  '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors';

/**
 * Esri World Light Gray Base raster tiles.
 * Note the `{z}/{y}/{x}` ordering — ArcGIS REST puts row (y) before column (x).
 */
export const FALLBACK_RASTER_URL =
  "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}";

/** World_Light_Gray_Base has no tiles beyond zoom 16. */
export const FALLBACK_RASTER_MAX_ZOOM = 16;

export const FALLBACK_RASTER_ATTRIBUTION =
  'Tiles &copy; <a href="https://www.esri.com/" target="_blank" rel="noopener noreferrer">Esri</a> ' +
  "&mdash; Esri, DeLorme, NAVTEQ";

/**
 * How long to wait for the vector style to report `load` before giving up and
 * keeping the raster basemap instead.
 */
export const VECTOR_STYLE_LOAD_TIMEOUT_MS = 10_000;

/**
 * Hard cap on how long the map may report "not ready".
 *
 * The basemap normally signals readiness when the raster tiles paint or the
 * vector style loads, whichever lands first. If the device is offline both
 * signals never arrive, so this guarantees the loading skeleton always clears
 * rather than covering the map forever.
 */
export const BASEMAP_READY_TIMEOUT_MS = 6_000;
