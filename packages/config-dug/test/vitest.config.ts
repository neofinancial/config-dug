import { defineConfig } from 'vitest/config';

// eslint-disable-next-line import/no-default-export
export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    logHeapUsage: true,
    include: ['test/**/*.test.ts'],
    maxConcurrency: 16,
    coverage: {
      provider: 'v8',
      include: ['src/*'],
      exclude: [],
      reporter: ['lcov', 'text', 'json-summary', 'html'],
      reportsDirectory: './coverage',
    },
  },
});
