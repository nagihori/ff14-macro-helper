import { CARD_SIZE, macroCardImage } from '@/lib/og/macro-card'
import { listPublishedMacrosByTag } from '@/lib/published-macros/repository'
import { BRAND_NAME } from '@/lib/site-config'

// タグ別一覧の共有カード。タグ名を大きく、パネルにそのタグの新しいマクロ名を並べ、足元に一緒に付いているタグを出す。
// タグが無い（0 件）ときは、サイト共通の名前と羽ペンだけのカード。
export const alt = `タグ別の公開マクロ | ${BRAND_NAME}`
export const size = CARD_SIZE
export const contentType = 'image/png'

// URL のタグを文字列へ戻す（タグ別一覧ページと同じ。Next が先にデコードしている場合は、そのまま使う）。
function readTag(raw: string): string {
  try {
    return decodeURIComponent(raw)
  } catch {
    return raw
  }
}

export default async function Image({ params }: { params: Promise<{ tag: string }> }) {
  const tag = readTag((await params).tag)
  const macros = await listPublishedMacrosByTag(tag)
  if (macros.length === 0) return macroCardImage({ body: null })

  // 一緒に付いているタグを、多く一緒に付くものから（タグ別一覧ページと同じ並び）。
  const counts = new Map<string, number>()
  for (const macro of macros) for (const other of macro.tags) if (other !== tag) counts.set(other, (counts.get(other) ?? 0) + 1)
  const related = [...counts].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'ja')).map(([name]) => name)

  return macroCardImage({
    title: `#${tag}`,
    body: null,
    listLines: macros.slice(0, 5).map((macro) => `・${macro.title}`),
    listMore: macros.length > 5 ? `… 全 ${macros.length} 件` : '',
    tags: related,
  })
}
