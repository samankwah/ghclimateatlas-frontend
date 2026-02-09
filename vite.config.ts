import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { readFileSync } from 'fs'
import type { Plugin } from 'vite'

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
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          leaflet: ['leaflet', 'react-leaflet'],
          charts: ['highcharts', 'highcharts-react-official'],
          vendor: ['react', 'react-dom', '@tanstack/react-query', 'axios'],
        },
      },
    },
  },
})
