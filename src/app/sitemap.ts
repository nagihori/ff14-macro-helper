import type { MetadataRoute } from 'next'
import { listSitemapEntries } from '@/lib/published-macros/repository'
import { getSiteUrl } from '@/lib/site-url'

// 1 時間ごとに作り直す。公開・停止・削除が反映されるまでの遅れはこの範囲。
export const revalidate = 3600

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getSiteUrl()
  const pages: MetadataRoute.Sitemap = ['/', '/macros', '/terms', '/privacy'].map((path) => ({ url: `${base}${path === '/' ? '' : path}` }))
  try {
    const macros = await listSitemapEntries()
    return [...pages, ...macros.map((macro) => ({ url: `${base}/macros/${macro.slug}`, lastModified: macro.publishedAt }))]
  } catch (error) {
    // DB に届かないときも sitemap 自体は返す（固定ページだけ）。
    console.error('[sitemap] 公開マクロを読めませんでした', error)
    return pages
  }
}
