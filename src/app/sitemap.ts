import type { MetadataRoute } from 'next'
import { listIndexableTags, listSitemapEntries } from '@/lib/published-macros/repository'
import { MIN_INDEXABLE_TAG_MACROS, tagPath } from '@/lib/published-macros/tags'
import { getSiteUrl } from '@/lib/site-url'

// 1 時間ごとに作り直す。公開・停止・削除が反映されるまでの遅れはこの範囲。
export const revalidate = 3600

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getSiteUrl()
  const pages: MetadataRoute.Sitemap = ['/', '/macros', '/terms', '/privacy'].map((path) => ({ url: `${base}${path === '/' ? '' : path}` }))
  try {
    const [macros, tags] = await Promise.all([listSitemapEntries(), listIndexableTags(MIN_INDEXABLE_TAG_MACROS)])
    return [
      ...pages,
      ...tags.map((tag) => ({ url: `${base}${tagPath(tag)}` })),
      ...macros.map((macro) => ({ url: `${base}/macros/${macro.slug}`, lastModified: macro.publishedAt })),
    ]
  } catch (error) {
    // DB に届かないときも sitemap 自体は返す（固定ページだけ）。
    console.error('[sitemap] 公開マクロを読めませんでした', error)
    return pages
  }
}
