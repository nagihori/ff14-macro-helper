// 記事（content/articles/*.md）の先頭のフロントマター（---で囲んだ設定）を読む、純粋な部品。
// YAML の全部ではなく、記事に必要な小さな部分だけ：`キー: 値` の行、tags は `[a, b]` か `a, b`。値の前後の引用符は外す。
export type ArticleMeta = { title: string; date: string; description: string; tags: string[] }

export type ParsedArticle = { ok: true; meta: ArticleMeta; body: string } | { ok: false; error: string }

const unquote = (value: string) => value.trim().replace(/^(["'])(.*)\1$/, '$2')

export function parseFrontmatter(source: string): ParsedArticle {
  const text = source.replace(/^\uFEFF/, '')
  const match = text.match(/^---[ \t]*\r?\n([\s\S]*?)\r?\n---[ \t]*(?:\r?\n|$)/)
  if (!match) return { ok: false, error: 'フロントマター（先頭の --- で囲んだ設定）がありません' }
  const fields = new Map<string, string>()
  for (const line of match[1].split(/\r?\n/)) {
    const found = line.match(/^([A-Za-z_]+)[ \t]*:[ \t]*(.*)$/)
    if (found) fields.set(found[1].toLowerCase(), found[2])
  }
  const title = unquote(fields.get('title') ?? '')
  const date = unquote(fields.get('date') ?? '')
  if (!title) return { ok: false, error: 'title がありません' }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(Date.parse(date))) return { ok: false, error: 'date は YYYY-MM-DD の形で書いてください' }
  const rawTags = (fields.get('tags') ?? '').trim().replace(/^\[(.*)\]$/, '$1')
  const tags = rawTags.split(/[,、，]/).map((tag) => unquote(tag).replace(/^[#＃]/, '').trim()).filter(Boolean)
  return { ok: true, meta: { title, date, description: unquote(fields.get('description') ?? ''), tags }, body: text.slice(match[0].length) }
}
