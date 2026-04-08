import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      // next-auth beta imports 'next/server' without .js extension; map it for Vitest
      'next/server': path.resolve(__dirname, './node_modules/next/server.js'),
    },
  },
});
