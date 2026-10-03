// 説明文の解析（純粋な部品）。次の 2 つを見つける：
//  - `コード`（バッククォート 1〜3 個で囲んだ範囲。1 行の中だけ）→ 等幅で表示する。中の URL などは展開しない
//  - 自サイトのマクロ URL（{SITE_URL}/macros/{slug}）→ タイトルリンクに展開する
// 太字・取り消し線などの Markdown は扱わない（コードだけ）。複数行にまたがるコードブロック（```の独立した行）も扱わない。
// DB には依存しない（タイトルの解決は resolve-descriptions.ts）。保存するのは入力された文字列のままで、展開は表示のときだけ。
export type DescriptionPart =
  | { type: 'text'; text: string }
  | { type: 'code'; text: string } // `コード`。バッククォートは外した中身
  | { type: 'macro'; slug: string; raw: string } // 解析しただけ（まだタイトルを引いていない）
  | { type: 'link'; slug: string; title: string } // 公開中のマクロ → タイトルのリンク
  | { type: 'deleted'; title: string } // 削除済み → 「タイトル（削除済み）」リンクなし

// 同じ長さのバッククォートで囲んだ、改行を含まない範囲（\`x\`・\`\`x\`\`・\`\`\`x\`\`\`）。開きより長い・短い並びは対象外。
const CODE_PATTERN = /(?<!`)(`{1,3})(?!`)([^`\n]+?)\1(?!`)/g

// ?m= の共有URL・外部 URL・パスや query が続く URL は対象外（slug の直後が URL の続きでない時だけ一致させる）。
export function parseDescription(description: string, siteUrl: string): DescriptionPart[] {
  const parts: DescriptionPart[] = []
  let cursor = 0
  for (const match of description.matchAll(CODE_PATTERN)) {
    const start = match.index ?? 0
    parts.push(...parseMacroUrls(description.slice(cursor, start), siteUrl))
    parts.push({ type: 'code', text: match[2] })
    cursor = start + match[0].length
  }
  parts.push(...parseMacroUrls(description.slice(cursor), siteUrl))
  return parts
}

// コードの外側の文字列から、自サイトのマクロ URL を取り出す。
function parseMacroUrls(text: string, siteUrl: string): DescriptionPart[] {
  const escaped = siteUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const pattern = new RegExp(`${escaped}/macros/([A-Za-z0-9_-]+)(?![A-Za-z0-9_\\-/?#=&%])`, 'gi')
  const parts: DescriptionPart[] = []
  let cursor = 0
  for (const match of text.matchAll(pattern)) {
    const start = match.index ?? 0
    if (start > cursor) parts.push({ type: 'text', text: text.slice(cursor, start) })
    parts.push({ type: 'macro', slug: match[1].toLowerCase(), raw: match[0] })
    cursor = start + match[0].length
  }
  if (cursor < text.length) parts.push({ type: 'text', text: text.slice(cursor) })
  return parts
}

// リンクにできない場所（カード全体がリンクの一覧など・meta の description）用に、タイトルだけの文字列にする。
export function descriptionToPlainText(parts: DescriptionPart[]): string {
  return parts
    .map((part) => (part.type === 'text' || part.type === 'code' ? part.text : part.type === 'macro' ? part.raw : part.type === 'link' ? part.title : `${part.title}（削除済み）`))
    .join('')
}
