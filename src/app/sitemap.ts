import type { MetadataRoute } from 'next'
import { listArticles } from '@/lib/articles/load'
import { listIndexableTags, listSitemapEntries } from '@/lib/published-macros/repository'
import { MIN_INDEXABLE_TAG_MACROS, tagPath } from '@/lib/published-macros/tags'
import { getSiteUrl } from '@/lib/site-url'

// 1 時間ごとに作り直す。公開・停止・削除が反映されるまでの遅れはこの範囲。
export const revalidate = 3600

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getSiteUrl()
  const articles = listArticles()
  // 記事が 1 本も無いあいだは、一覧も載せない（一覧のページ自体が noindex のため）。
  const staticPaths = ['/', '/macros', ...(articles.length > 0 ? ['/articles'] : []), '/terms', '/privacy']
  const pages: MetadataRoute.Sitemap = [
    ...staticPaths.map((path) => ({ url: `${base}${path === '/' ? '' : path}` })),
    ...articles.map((article) => ({ url: `${base}/articles/${article.slug}`, lastModified: article.meta.date })),
  ]
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
