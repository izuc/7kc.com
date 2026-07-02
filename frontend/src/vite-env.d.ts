/// <reference types="vite/client" />

// Catalogue size baked in from shared/recipes.json by the `define` in
// vite.config.ts (mirrored in vitest.config.ts for tests).
declare const __RECIPE_COUNT__: number;

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  readonly VITE_API_PROXY?: string;
  readonly VITE_PLAUSIBLE_DOMAIN?: string;
  readonly VITE_PLAUSIBLE_SRC?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
