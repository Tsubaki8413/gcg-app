import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // APIへのリクエストを転送
      '/api': {
        target: 'http://127.0.0.1:8080',
        changeOrigin: true,
      },
      // 画像へのリクエストも転送
      '/images': {
        target: 'http://127.0.0.1:8080',
        changeOrigin: true,
      }
    }
  }
})