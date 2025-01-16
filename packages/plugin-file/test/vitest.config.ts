import { defineProject } from 'vitest/config';

export default defineProject({
  test: {
    globals: true,
    environment: 'node',
    logHeapUsage: true,
    include: ['test/**/*.test.ts'],
    maxConcurrency: 16,
  },
});
