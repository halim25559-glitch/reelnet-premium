export default function robots() {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: '/api/',
    },
    sitemap: 'https://reelnet-premium.vercel.app/sitemap.xml',
  };
}
