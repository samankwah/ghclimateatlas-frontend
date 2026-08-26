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
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
    __APP_RELEASE_DATE__: JSON.stringify("2026-03-25"),
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          leaflet: ['leaflet', 'react-leaflet'],
          maplibre: ['maplibre-gl', '@maplibre/maplibre-gl-leaflet'],
          vendor: ['react', 'react-dom', '@tanstack/react-query', 'axios'],
        },
      },
    },
  },
})
