import { createSerwistRoute } from "@serwist/turbopack";

export const { GET } = createSerwistRoute({
  swSrc: "src/app/sw.ts",
  useNativeEsbuild: true,
  additionalPrecacheEntries: [
    // Only precache pages that don't require auth — auth-required pages
    // (dashboard, scout/*) are cached at runtime via the OfflinePrecache
    // component so the SW stores the *authenticated* HTML.
    { url: '/login', revision: Date.now().toString() },
    { url: '/signup', revision: Date.now().toString() },
  ],
});
