import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

const isIntegration = process.env.VITEST_MODE === 'integration';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: isIntegration ? 'node' : 'jsdom',
    globals: true,
    setupFiles: isIntegration ? ['./src/test/integration/setup.ts'] : ['./src/test/setup.ts'],
    include: isIntegration
      ? ['src/**/*.integration.test.{ts,tsx}']
      : ['src/**/*.test.{ts,tsx}', '!src/**/*.integration.test.{ts,tsx}'],
    server: {
      deps: {
        inline: ['stripe'],
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      // next-auth beta imports 'next/server' without .js extension; map it for Vitest
      'next/server': path.resolve(__dirname, './node_modules/next/server.js'),
    },
  },
});
