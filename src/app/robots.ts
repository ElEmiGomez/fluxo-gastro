import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://fluxoapp.com'

  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/menu/', '/legal'],
        disallow: ['/staff/', '/api/'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
