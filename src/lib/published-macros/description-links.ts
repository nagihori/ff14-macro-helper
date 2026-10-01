// 説明文の中の「自サイトのマクロ URL（{SITE_URL}/macros/{slug}）」を見つけて、タイトルリンクに展開するための純粋な部品。
// DB には依存しない（タイトルの解決は resolve-descriptions.ts）。保存するのは入力された文字列のままで、展開は表示のときだけ。
export type DescriptionPart =
  | { type: 'text'; text: string }
  | { type: 'macro'; slug: string; raw: string } // 解析しただけ（まだタイトルを引いていない）
  | { type: 'link'; slug: string; title: string } // 公開中のマクロ → タイトルのリンク
  | { type: 'deleted'; title: string } // 削除済み → 「タイトル（削除済み）」リンクなし

// ?m= の共有URL・外部 URL・パスや query が続く URL は対象外（slug の直後が URL の続きでない時だけ一致させる）。
export function parseDescription(description: string, siteUrl: string): DescriptionPart[] {
  const escaped = siteUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const pattern = new RegExp(`${escaped}/macros/([A-Za-z0-9_-]+)(?![A-Za-z0-9_\\-/?#=&%])`, 'gi')
  const parts: DescriptionPart[] = []
  let cursor = 0
  for (const match of description.matchAll(pattern)) {
    const start = match.index ?? 0
    if (start > cursor) parts.push({ type: 'text', text: description.slice(cursor, start) })
    parts.push({ type: 'macro', slug: match[1].toLowerCase(), raw: match[0] })
    cursor = start + match[0].length
  }
  if (cursor < description.length) parts.push({ type: 'text', text: description.slice(cursor) })
  return parts
}

// リンクにできない場所（カード全体がリンクの一覧など・meta の description）用に、タイトルだけの文字列にする。
export function descriptionToPlainText(parts: DescriptionPart[]): string {
  return parts
    .map((part) => (part.type === 'text' ? part.text : part.type === 'macro' ? part.raw : part.type === 'link' ? part.title : `${part.title}（削除済み）`))
    .join('')
}
