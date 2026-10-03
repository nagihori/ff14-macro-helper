import { descriptionToPlainText } from '@/lib/published-macros/description-links'
import { listFeedMacros } from '@/lib/published-macros/repository'
import { withDescriptionParts } from '@/lib/published-macros/resolve-descriptions'
import { BRAND_NAME } from '@/lib/site-config'
import { getSiteUrl } from '@/lib/site-url'
import { buildAtomFeed } from './atom'

const FEED_LIMIT = 30

// 新着の公開マクロの Atom フィードを Response にする。/macros/feed.xml と、タグ別（/macros/tag/[tag]/feed.xml）で共通。
// tag を渡したとき、該当が 0 件なら 404（存在しないタグのフィードを作らない）。
export async function macroFeedResponse(tag?: string): Promise<Response> {
  const siteUrl = getSiteUrl()
  try {
    const feed = await listFeedMacros(FEED_LIMIT, tag)
    if (tag && feed.length === 0) return new Response('タグが見つかりません。', { status: 404 })
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
    const path = tag ? `/macros/tag/${encodeURIComponent(tag)}` : '/macros'
    const xml = buildAtomFeed({
      title: tag ? `#${tag} の新着マクロ | ${BRAND_NAME}` : `${BRAND_NAME} 新着マクロ`,
      subtitle: tag ? `「#${tag}」のついた、公開されたばかりの FFXIV マクロ` : '公開されたばかりの FFXIV マクロ',
      alternateUrl: `${siteUrl}${path}`,
      feedUrl: `${siteUrl}${path}/feed.xml`,
      entries,
    })
    return new Response(xml, { headers: { 'Content-Type': 'application/atom+xml; charset=utf-8' } })
  } catch (error) {
    console.error('[feed] 公開マクロを読めませんでした', error)
    return new Response('フィードを作れませんでした。', { status: 503 })
  }
}
