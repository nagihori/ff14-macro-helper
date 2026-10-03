// 記事の本文を、Markdown の部分と、マクロの埋め込み（`::macro[slug]` だけの行）に分ける、純粋な部品。
// コードブロック（``` で囲んだ範囲）の中の `::macro[…]` は、書き方の例なので、埋め込みとして扱わない。
export type ArticleSegment = { type: 'markdown'; text: string } | { type: 'macro'; slug: string }

const DIRECTIVE = /^::macro\[([A-Za-z0-9_-]+)\][ \t]*$/

export function splitArticleBody(body: string): ArticleSegment[] {
  const segments: ArticleSegment[] = []
  let buffer: string[] = []
  let fence: string | null = null
  const flush = () => {
    const text = buffer.join('\n').trim()
    if (text) segments.push({ type: 'markdown', text })
    buffer = []
  }
  for (const line of body.split(/\r?\n/)) {
    const fenceMatch = line.match(/^ {0,3}(`{3,}|~{3,})/)
    if (fenceMatch) {
      if (fence === null) fence = fenceMatch[1][0]
      else if (fenceMatch[1][0] === fence) fence = null
    }
    const directive = fence === null ? line.match(DIRECTIVE) : null
    if (directive) {
      flush()
      segments.push({ type: 'macro', slug: directive[1].toLowerCase() })
    } else {
      buffer.push(line)
    }
  }
  flush()
  return segments
}
