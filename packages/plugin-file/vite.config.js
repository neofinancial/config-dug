import { defineConfig } from 'vitest/config';

// https://vitest.dev/config/#configuration
// usage of swc: https://github.com/vitest-dev/vitest/discussions/1905
export default defineConfig({
  test: {
    globals: true,
    include: ['test/**/*.test.ts'],
    environment: 'node',
    testTimeout: 10000,
    threads: false,
    logHeapUsage: true,
    reporters: process.environment === 'TEST' ? 'verbose' : 'default',
    coverage: {
      reporter: ['lcov', 'text'],
      reportsDirectory: './coverage',
    },
  },
});
