/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import { execSync } from 'child_process'

const gitCommit = (() => {
  try { return execSync('git rev-parse --short HEAD').toString().trim() }
  catch { return 'unknown' }
})()

const buildDate = new Date().toISOString()

export default defineConfig({
  plugins: [react()],
  define: {
    __GIT_COMMIT__: JSON.stringify(gitCommit),
    __BUILD_DATE__: JSON.stringify(buildDate),
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'dist',
  },
  test: {
    environment: 'node',
  },
})
