import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // The API runs separately (npm run dev:api). Same-origin /api in the browser.
  server: { proxy: { '/api': 'http://127.0.0.1:3000' } },
  preview: { proxy: { '/api': 'http://127.0.0.1:3000' } },
})
