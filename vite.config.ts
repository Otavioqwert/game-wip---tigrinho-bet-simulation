
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // Libera acesso pelo IP da rede (ex: 192.168.x.x) para testar no celular
    port: 5173
  },
  build: {
    outDir: 'dist',
    sourcemap: false
  }
})
