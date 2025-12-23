import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // /api で始まるリクエストを PHPサーバー(localhost:80) へ転送
      '/api': {
        target: 'http://localhost:80', // 環境に合わせて変更してください
        changeOrigin: true,
      }
    }
  }
})