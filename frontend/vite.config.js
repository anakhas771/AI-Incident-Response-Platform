/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';
// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
      '@api': path.resolve(import.meta.dirname, './src/api'),
      '@components': path.resolve(import.meta.dirname, './src/components'),
      '@features': path.resolve(import.meta.dirname, './src/features'),
      '@hooks': path.resolve(import.meta.dirname, './src/hooks'),
      '@layouts': path.resolve(import.meta.dirname, './src/layouts'),
      '@routes': path.resolve(import.meta.dirname, './src/routes'),
      '@styles': path.resolve(import.meta.dirname, './src/styles'),
      '@types': path.resolve(import.meta.dirname, './src/types'),
      '@utils': path.resolve(import.meta.dirname, './src/utils'),
    },
  },
  server: {
    port: 5173,
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  build: {
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks: function (id) {
          if (id.includes('node_modules')) {
            if (
              id.includes('react-dom') ||
              id.includes('react-router-dom') ||
              id.includes('/react/')
            ) {
              return 'react-vendor';
            }
            if (id.includes('@tanstack/react-query')) {
              return 'tanstack-query';
            }
            if (id.includes('framer-motion') || id.includes('lucide-react')) {
              return 'ui-vendor';
            }
            if (id.includes('recharts')) {
              return 'recharts-vendor';
            }
          }
        },
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
  },
});
