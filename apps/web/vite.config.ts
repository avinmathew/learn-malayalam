import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, '../..', '')
  const apiProxyTarget = env.VITE_API_PROXY_TARGET?.trim() || `http://localhost:${env.PORT?.trim() || '3001'}`

  return {
    base: command === 'build' ? '/learn-malayalam/' : '/',
    envDir: '../..',
    plugins: [react(), tailwindcss()],
    server: {
      proxy: {
        '/api': {
          target: apiProxyTarget,
          changeOrigin: true,
        },
      },
    },
  }
})
