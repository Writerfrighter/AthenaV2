import { createSerwistRoute } from "@serwist/turbopack";

export const { GET } = createSerwistRoute({
  swSrc: "app/sw.ts",
  useNativeEsbuild: true,
  additionalPrecacheEntries: [
    { url: '/dashboard', revision: null },
    { url: '/scout/matchscout', revision: null },
    { url: '/scout/pitscout', revision: null },
    { url: '/login', revision: null },
    { url: '/signup', revision: null },
  ],
});
