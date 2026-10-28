// The public site (Overview, Dashboard, Resources, Case Studies, ...) stays hidden
// in deployed builds until its design is approved. While it is off, every path
// shows the Map Viewer, as the live site did before those pages were added.
//
// Turn it on with VITE_PUBLIC_SITE_ENABLED=true at build time. The dev server
// turns it on through .env.development; production builds never read that file.
export const PUBLIC_SITE_ENABLED = import.meta.env.VITE_PUBLIC_SITE_ENABLED === "true";
