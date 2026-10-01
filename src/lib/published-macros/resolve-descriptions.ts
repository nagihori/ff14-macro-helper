import { getSiteUrl } from '@/lib/site-url'
import { parseDescription, type DescriptionPart } from './description-links'
import { findMacroTitles } from './repository'
import type { PublishedMacro } from './types'

// 説明内の自サイトのマクロ URL を、タイトルリンクへ展開した descriptionParts を付けて返す。
// 渡された公開中のマクロのタイトルはそのまま使い（一覧ページは全件を持っているので追加の問い合わせが要らない）、
// 足りない slug だけ 1 回の問い合わせでまとめて引く。説明に URL が無ければ DB には触らない。
export async function withDescriptionParts(macros: PublishedMacro[]): Promise<PublishedMacro[]> {
  const siteUrl = getSiteUrl()
  const parsed = macros.map((macro) => parseDescription(macro.description, siteUrl))
  const wanted = new Set(parsed.flatMap((parts) => parts.flatMap((part) => (part.type === 'macro' ? [part.slug] : []))))
  if (wanted.size === 0) return macros.map((macro, index) => ({ ...macro, descriptionParts: parsed[index] }))

  const known = new Map<string, { title: string; deleted: boolean }>()
  for (const macro of macros) if (macro.status === 'published') known.set(macro.slug, { title: macro.title, deleted: false })
  const missing = [...wanted].filter((slug) => !known.has(slug))
  for (const [slug, found] of await findMacroTitles(missing)) known.set(slug, found)

  return macros.map((macro, index) => ({
    ...macro,
    descriptionParts: parsed[index].map((part): DescriptionPart => {
      if (part.type !== 'macro') return part
      const found = known.get(part.slug)
      if (!found) return { type: 'text', text: part.raw } // 停止中・存在しない
      return found.deleted ? { type: 'deleted', title: found.title } : { type: 'link', slug: part.slug, title: found.title }
    }),
  }))
}
