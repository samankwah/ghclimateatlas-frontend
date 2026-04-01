# Ghana Climate Atlas Frontend

React + TypeScript + Vite frontend for the Ghana Climate Atlas.

This application renders an interactive district-level climate map of Ghana with a floating control system, comparison timelines, category-based variable browsing, and a district side panel for charts and summary statistics.

## Current State

The frontend currently supports:

- interactive Ghana district map with climate coloring
- period switching for `baseline`, `2030`, `2050`, and `2080`
- scenario switching for `rcp45` and `rcp85`
- variable browsing by category:
  - hot weather
  - cold weather
  - temperature
  - precipitation
  - agriculture
- district detail side panel with:
  - selected district summary
  - baseline vs selected future-period comparison
  - period-aware chart highlight band
  - statistics table tied to the active selected period
  - downloads section
- month-level submenu support for temperature and precipitation when the backend exposes monthly variables
- dynamic browser page titles based on district, variable, scenario, and period

## Stack

- React 19
- TypeScript
- Vite
- TanStack Query
- Leaflet / React Leaflet
- Highcharts

## Project Structure

```text
src/
  api/                API client helpers
  components/         UI, map, panels, categories, charts
  hooks/              data-fetching and map state hooks
  data/               local story/config data
  types/              shared frontend types
  utils/              formatting and color scale helpers
```

## Requirements

- Node.js 18+ recommended
- backend API running locally from `../backend`

The frontend expects the FastAPI backend to serve climate and district data. By default, development uses the local backend on `http://127.0.0.1:8000/api`.

For hosted deployments such as Netlify, set:

```bash
VITE_API_URL=https://ghclimateatlas-backend.vercel.app/api
```

Do not set `VITE_API_URL` in normal local development unless you intentionally want to test against a remote backend. When it is unset, the frontend falls back to `http://127.0.0.1:8000/api` on localhost and to the Vercel backend on non-local hosts.

If an older deployment still points to `https://ghana-climate-atlas-api.onrender.com`, update it to the URL above. The frontend normalizes that stale hostname back to the active Render service, but the deployment environment should still be corrected.

## Getting Started

Install dependencies:

```bash
npm install
```

Start the frontend dev server:

```bash
npm run dev
```

Start the backend separately from the sibling `backend` folder:

```bash
uvicorn app.main:app --reload --port 8000
```

## Available Scripts

```bash
npm run dev
npm run build
npm run preview
npm run lint
```

## Build Notes

TypeScript compilation is validated with:

```bash
npx tsc -b
```

In some restricted Windows environments, `vite build` can fail with an `esbuild spawn EPERM` process-spawn error even when the code is valid. That is an environment restriction, not a frontend TypeScript issue.

## Backend Dependency Notes

Recent frontend behavior depends on backend support for:

- annual variables
- seasonal variables
- monthly temperature variables such as `mean_temp_mar`, `max_temp_jul`, `min_temp_dec`
- monthly precipitation variables such as `precipitation_sep`

If monthly submenu items remain disabled, verify that `GET /api/climate/variables` is returning those monthly IDs.

## Status

This is no longer a starter Vite app. It is an actively customized atlas interface with:

- custom map overlays
- dynamic side panel behavior
- period-aware chart rendering
- backend-driven category availability
- tailored Ghana climate indicators and labels
