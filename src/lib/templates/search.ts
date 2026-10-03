// 雛形（タグ「雛形」が付いた公開マクロ）。エディタの検索と「雛形から始める」で使う。
// 一覧はサーバーが 1 時間ごとに取り直して渡し（published-macros/templates.ts）、検索は端末の中で瞬時に返す。
export type TemplateMacro = { slug: string; title: string; description: string; body: string; tags: string[] }

// コマンドの検索（commands/search.ts）と同じく、全角半角・大文字小文字・先頭の / の違いを無視する。
const normalize = (value: string) => value.normalize('NFKC').toLocaleLowerCase('ja-JP')
const terms = (query: string) => normalize(query).split(/[\s　]+/).map((term) => term.replace(/^[/#]+/, '')).filter(Boolean)

// 空白で区切った語をすべて含むものだけを返す（AND）。タイトルへの一致を、タグ・説明・本文より上に並べる。
// 同じ順位は、渡された順（役に立った順・新しい順）のまま。空の検索語では何も返さない。
export function searchTemplates(query: string, templates: TemplateMacro[], limit = 20): TemplateMacro[] {
  const words = terms(query)
  if (words.length === 0) return []
  const scored: { template: TemplateMacro; score: number; index: number }[] = []
  templates.forEach((template, index) => {
    const fields = [
      normalize(template.title),
      template.tags.map(normalize).join(' '),
      normalize(template.description),
      normalize(template.body),
    ]
    let score = 0
    for (const word of words) {
      const found = fields.findIndex((field) => field.includes(word))
      if (found < 0) return
      score += found
    }
    scored.push({ template, score, index })
  })
  return scored.sort((a, b) => a.score - b.score || a.index - b.index).slice(0, limit).map((item) => item.template)
}
