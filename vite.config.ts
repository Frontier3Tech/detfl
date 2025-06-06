import { defineConfig } from 'vite'
import preact from '@preact/preset-vite'

export default defineConfig({
  plugins: [preact()],
  resolve: {
    alias: {
      '~': '/src'
    }
  },
  optimizeDeps: {
    exclude: ['@preact/preset-vite']
  }
})