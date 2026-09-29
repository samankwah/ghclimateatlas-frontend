import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'
import type { Plugin } from 'vite'

const __dirname = dirname(fileURLToPath(import.meta.url))
const pkg = JSON.parse(readFileSync(resolve(__dirname, 'package.json'), 'utf-8')) as {
  version: string
}

// Plugin to handle GeoJSON imports as JSON
function geojsonPlugin(): Plugin {
  return {
    name: 'geojson-loader',
    transform(_code, id) {
      if (id.endsWith('.geojson')) {
        const json = readFileSync(id, 'utf-8')
        return {
          code: `export default ${json}`,
          map: null,
        }
      }
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), geojsonPlugin()],
  // maplibre-gl locates its web worker at runtime with
  // `new URL('./maplibre-gl-worker.mjs', import.meta.url)`. Pre-bundling moves
  // the entry into node_modules/.vite/deps, where that sibling file does not
  // exist, so the worker fetch 404s and the vector basemap fails to start in
  // dev. Serving both packages unbundled keeps import.meta.url pointing at the
  // real package directory. Dev only - the production build resolves it through
  // the maplibre manualChunk below.
  optimizeDeps: {
    exclude: ['maplibre-gl', '@maplibre/maplibre-gl-leaflet'],
  },
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
    __APP_RELEASE_DATE__: JSON.stringify("2026-03-25"),
  },
  build: {
    rollupOptions: {
      output: {
        // Matched by path rather than by package name: the name form let
        // react-leaflet's import of react-dom pull React's entry into the leaflet
        // chunk, which forced every public page to download the map library.
        manualChunks(id) {
          const packagePath = id.replace(/\\/g, '/').split('/node_modules/').pop()
          if (!packagePath || packagePath === id) return undefined
          const inPackage = (...names: string[]) => names.some((name) => packagePath.startsWith(`${name}/`))
          if (inPackage('maplibre-gl', '@maplibre/maplibre-gl-leaflet')) return 'maplibre'
          if (inPackage('leaflet', 'react-leaflet', '@react-leaflet')) return 'leaflet'
          if (inPackage('react', 'react-dom', 'scheduler', '@tanstack/react-query', '@tanstack/query-core', 'axios')) return 'vendor'
          return undefined
        },
      },
    },
  },
})
