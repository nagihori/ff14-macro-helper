import { CARD_SIZE, macroCardImage } from '@/lib/og/macro-card'
import { findPublishedMacro } from '@/lib/published-macros/repository'
import { BRAND_NAME } from '@/lib/site-config'

// 公開マクロの共有カード（OGP 画像）。公開中のマクロだけ中身を描き、それ以外は名前と羽ペンだけのカードにする。
// 描画は lib/og/macro-card.tsx（共有 URL のカードと共通）。
export const alt = `公開マクロ | ${BRAND_NAME}`
export const size = CARD_SIZE
export const contentType = 'image/png'

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const macro = await findPublishedMacro(slug)
  return macroCardImage(macro ? { title: macro.title, body: macro.body, tags: macro.tags } : { body: null })
}
