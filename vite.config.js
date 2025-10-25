import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: './',  // ← ESTA LÍNEA ES CRUCIAL
  build: {
    outDir: 'dist',
    emptyOutDir: true
  }
})