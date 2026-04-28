import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  css: {
    postcss: false,
  },
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node',
    globals: true,
    clearMocks: true,
    restoreMocks: true,
    css: false,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
});
