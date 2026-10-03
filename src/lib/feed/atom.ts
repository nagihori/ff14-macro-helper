// 新着の公開マクロの Atom フィード（Atom 1.0）。UI・DB に依存しない純粋な関数。
// 載せるのは公開済みのタイトル・説明・タグ・投稿者の公開名だけ。本文は載せない（詳細ページへ来てもらう）。
export type FeedEntry = {
  url: string
  title: string
  summary: string
  author: string
  tags: string[]
  published: string // ISO 8601（UTC）
}

const escapeXml = (text: string) =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

// XML 1.0 で使えない制御文字を落とす（投稿本文に紛れていると、フィード全体が読めなくなる）。
const stripControl = (text: string) => text.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '')
const text = (value: string) => escapeXml(stripControl(value))

export function buildAtomFeed({ title, subtitle, siteUrl, feedUrl, entries }: { title: string; subtitle: string; siteUrl: string; feedUrl: string; entries: FeedEntry[] }): string {
  // フィード全体の更新日時は、いちばん新しいエントリ（なければ UNIX エポック）。
  const updated = entries.reduce((latest, entry) => (entry.published > latest ? entry.published : latest), '1970-01-01T00:00:00Z')
  const items = entries.map((entry) => `  <entry>
    <title>${text(entry.title)}</title>
    <link href="${text(entry.url)}"/>
    <id>${text(entry.url)}</id>
    <published>${entry.published}</published>
    <updated>${entry.published}</updated>
    <author><name>${text(entry.author)}</name></author>
${entry.tags.map((tag) => `    <category term="${text(tag)}"/>`).join('\n')}${entry.tags.length > 0 ? '\n' : ''}    <summary>${text(entry.summary)}</summary>
  </entry>`)
  return `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom" xml:lang="ja">
  <title>${text(title)}</title>
  <subtitle>${text(subtitle)}</subtitle>
  <link rel="self" type="application/atom+xml" href="${text(feedUrl)}"/>
  <link rel="alternate" type="text/html" href="${text(siteUrl)}/macros"/>
  <id>${text(feedUrl)}</id>
  <updated>${updated}</updated>
${items.join('\n')}
</feed>
`
}
