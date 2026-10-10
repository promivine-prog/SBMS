import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { defineConfig } from 'vitest/config'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'SBMS — Smart Budgeting and Micro-Savings',
        short_name: 'SBMS',
        start_url: '.',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#0e7c3a',
        icons: [
          { src: 'vite.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
        ],
      },
    }),
  ],
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
