import { defineConfig } from 'vitest/config';

/** Suite unitaria + integración opcional (RUN_INTEGRATION=1 + DATABASE_URL). */
export default defineConfig({
  test: {
    name: 'fintech-core',
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/use-cases/**/*.ts', 'src/domain/**/*.ts', 'src/infrastructure/**/*.ts'],
    },
  },
});
