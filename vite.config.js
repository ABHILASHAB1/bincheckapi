import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true,
    host: '127.0.0.1',
    allowedHosts: ['evident-skier-nylon.ngrok-free.dev'],
    hmr: {
      host: 'evident-skier-nylon.ngrok-free.dev',
      protocol: 'wss',
      clientPort: 443
    },
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:3002',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, '/api')
      }
    }
  }
})
