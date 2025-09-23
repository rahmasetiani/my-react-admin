import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api/v1': {
        target: 'http://localhost:8080', // samakan dengan APP_PORT backend
        changeOrigin: true,
      },
      // kalau endpoint /health ada di root (bukan /api/v1), ikutkan juga:
      '/health': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
})
