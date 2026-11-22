import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // KaTeX and the 45 questions are needed on the first screen, so one chunk is intended.
  build: { chunkSizeWarningLimit: 1200 },
  test: { include: ['src/**/*.test.ts'] },
})
