import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    // En dev : proxy les appels API vers le backend FastAPI local
    proxy: {
      '/auth':        { target: 'http://localhost:8000', changeOrigin: true },
      '/users':       { target: 'http://localhost:8000', changeOrigin: true },
      '/simulations': { target: 'http://localhost:8000', changeOrigin: true },
      '/prediction':  { target: 'http://localhost:8000', changeOrigin: true },
      '/health':      { target: 'http://localhost:8000', changeOrigin: true },
    },
  },
})
