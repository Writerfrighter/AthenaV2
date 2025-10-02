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
    lang: 'en',
    dir: 'ltr',
    categories: ['productivity', 'utilities'],
    prefer_related_applications: false,
    related_applications: [],
    display_override: ['window-controls-overlay', 'standalone'],
    launch_handler: {
      client_mode: 'focus-existing'
    },
    shortcuts: [
      {
        name: 'Match Scouting',
        short_name: 'Match Scout',
        description: 'Start match scouting',
        url: '/scout/matchscout',
        icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }]
      },
      {
        name: 'Pit Scouting',
        short_name: 'Pit Scout',
        description: 'Start pit scouting',
        url: '/scout/pitscout',
        icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }]
      },
      {
        name: 'Dashboard',
        short_name: 'Dashboard',
        description: 'View scouting dashboard',
        url: '/dashboard',
        icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }]
      }
    ],
    icons: [
      {
        src: '/icons/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any'
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any'
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable'
      },
      {
        src: '/icons/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable'
      }
    ],
  }
}
