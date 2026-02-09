import { createSerwistRoute } from "@serwist/turbopack";

export const { GET } = createSerwistRoute({
  swSrc: "src/app/sw.ts",
  useNativeEsbuild: true,
  additionalPrecacheEntries: [
    { url: '/dashboard', revision: Date.now().toString() },
    { url: '/scout/matchscout', revision: Date.now().toString() },
    { url: '/scout/pitscout', revision: Date.now().toString() },
    { url: '/login', revision: Date.now().toString() },
    { url: '/signup', revision: Date.now().toString() },
  ],
});
