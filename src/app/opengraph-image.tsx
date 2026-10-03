import { macroCardImage, CARD_SIZE } from '@/lib/og/macro-card'
import { BRAND_NAME } from '@/lib/site-config'

// サイト共通の共有カード（トップ・公開マクロ一覧・規約類など、専用のカードを持たないページ）。名前と羽ペンだけのシンプルな顔。
// 公開マクロの詳細・タグ別一覧は、それぞれの階層の opengraph-image が上書きする。
export const alt = BRAND_NAME
export const size = CARD_SIZE
export const contentType = 'image/png'

export default function Image() {
  return macroCardImage({ body: null })
}
