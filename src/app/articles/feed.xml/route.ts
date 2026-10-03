import { buildAtomFeed } from '@/lib/feed/atom'
import { listArticles } from '@/lib/articles/load'
import { BRAND_NAME } from '@/lib/site-config'
import { getSiteUrl } from '@/lib/site-url'

// 記事の Atom フィード（/articles/feed.xml）。記事はビルド時に決まるので、静的に作る。
export const dynamic = 'force-static'

export function GET() {
  const siteUrl = getSiteUrl()
  const entries = listArticles().slice(0, 30).map((article) => ({
    url: `${siteUrl}/articles/${article.slug}`,
    title: article.meta.title,
    summary: article.meta.description || article.meta.title,
    author: BRAND_NAME,
    tags: article.meta.tags,
    published: `${article.meta.date}T00:00:00Z`,
  }))
  const xml = buildAtomFeed({ title: `${BRAND_NAME} 記事`, subtitle: 'FFXIV マクロの作り方や小ネタ', alternateUrl: `${siteUrl}/articles`, feedUrl: `${siteUrl}/articles/feed.xml`, entries })
  return new Response(xml, { headers: { 'Content-Type': 'application/atom+xml; charset=utf-8' } })
}
