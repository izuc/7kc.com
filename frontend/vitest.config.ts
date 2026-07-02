import { readFileSync } from 'node:fs';
import { defineConfig } from 'vitest/config';

// Mirror the vite.config.ts define so any tested module can use it.
const RECIPE_COUNT = JSON.parse(
  readFileSync(new URL('../shared/recipes.json', import.meta.url), 'utf8')
).length;

export default defineConfig({
  define: {
    __RECIPE_COUNT__: JSON.stringify(RECIPE_COUNT),
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
