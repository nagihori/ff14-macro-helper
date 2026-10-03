import type { MetadataRoute } from 'next'
import { getSiteUrl } from '@/lib/site-url'

// 検索に出したいのは、トップ・公開マクロの一覧と詳細・規約類。
// 投稿・編集の画面、共有URL（?m=）、一覧の検索結果（?q=）は、中身のないページや無数の URL になるので巡回させない。
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/api/', '/og/', '/s/', '/macros/submit', '/macros/*/edit', '/?m=', '/macros?q='] },
    sitemap: `${getSiteUrl()}/sitemap.xml`,
  }
}
