import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/api/',
        '/dashboard/',
        '/scout/',
        '/login',
        '/signup',
      ],
    },
    sitemap: 'https://trcscouting.com/sitemap.xml',
  };
}
