import { buildAtomFeed } from '@/lib/feed/atom'
import { descriptionToPlainText } from '@/lib/published-macros/description-links'
import { listFeedMacros } from '@/lib/published-macros/repository'
import { withDescriptionParts } from '@/lib/published-macros/resolve-descriptions'
import { BRAND_NAME } from '@/lib/site-config'
import { getSiteUrl } from '@/lib/site-url'

// 新着の公開マクロの Atom フィード（/macros/feed.xml）。1 時間ごとに作り直す。
export const revalidate = 3600

const FEED_LIMIT = 30

export async function GET() {
  const siteUrl = getSiteUrl()
  try {
    const feed = await listFeedMacros(FEED_LIMIT)
    // 説明内の他マクロの URL は、タイトルへ展開してから文字にする（URL のまま流さない）。
    const described = await withDescriptionParts(feed.map(({ macro }) => macro))
    const entries = described.map((macro, index) => {
      const plain = descriptionToPlainText(macro.descriptionParts ?? [])
      return {
        url: `${siteUrl}/macros/${macro.slug}`,
        title: macro.title,
        summary: plain || `FFXIV マクロ（${macro.body.split('\n').length} 行）`,
        author: macro.authorHandle,
        tags: macro.tags,
        published: feed[index].publishedIso,
      }
    })
    const xml = buildAtomFeed({ title: `${BRAND_NAME} 新着マクロ`, subtitle: '公開されたばかりの FFXIV マクロ', siteUrl, feedUrl: `${siteUrl}/macros/feed.xml`, entries })
    return new Response(xml, { headers: { 'Content-Type': 'application/atom+xml; charset=utf-8' } })
  } catch (error) {
    console.error('[feed] 公開マクロを読めませんでした', error)
    return new Response('フィードを作れませんでした。', { status: 503 })
  }
}
