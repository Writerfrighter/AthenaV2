import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'TRC Scouting',
    short_name: 'TRC',
    description: 'Scouting app for TRC',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#ffffff',
    theme_color: '#0f172a',
    icons: [
      {
        src: '/TRCLogo.webp',
        sizes: '192x192',
        type: 'image/webp',
        purpose: 'any'
      },
      {
        src: '/TRCLogo.webp',
        sizes: '512x512',
        type: 'image/webp',
        purpose: 'any'
      },
      {
        src: '/TRCLogo.webp',
        sizes: '512x512',
        type: 'image/webp',
        purpose: 'maskable'
      }
    ],
  }
}
