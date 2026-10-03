import { describe, expect, it } from 'vitest'
import { parseFrontmatter } from './frontmatter'
import { renderMarkdown } from './markdown'
import { splitArticleBody } from './split'

describe('フロントマター', () => {
  it('title・date・description・tags を読み、本文を返す', () => {
    const result = parseFrontmatter('---\ntitle: "待機の入れ方"\ndate: 2026-10-03\ndescription: 秒数の決め方\ntags: [マクロ, 製作]\n---\n\n本文です\n')
    expect(result).toEqual({ ok: true, meta: { title: '待機の入れ方', date: '2026-10-03', description: '秒数の決め方', tags: ['マクロ', '製作'] }, body: '\n本文です\n' })
  })
  it('tags はカンマ区切り・# 付きでもよく、description と tags は省略できる', () => {
    const result = parseFrontmatter('---\ntitle: t\ndate: 2026-01-02\ntags: #a, ＃b\n---\nx')
    expect(result.ok && result.meta.tags).toEqual(['a', 'b'])
    expect(parseFrontmatter('---\ntitle: t\ndate: 2026-01-02\n---\nx')).toMatchObject({ ok: true, meta: { description: '', tags: [] } })
  })
  it('フロントマターなし・title なし・date の形違いは、理由つきで失敗', () => {
    expect(parseFrontmatter('本文だけ')).toMatchObject({ ok: false })
    expect(parseFrontmatter('---\ndate: 2026-01-02\n---\n')).toMatchObject({ ok: false, error: 'title がありません' })
    expect(parseFrontmatter('---\ntitle: t\ndate: 2026/01/02\n---\n')).toMatchObject({ ok: false })
    expect(parseFrontmatter('---\ntitle: t\ndate: 2026-13-45\n---\n')).toMatchObject({ ok: false })
  })
  it('Windows の改行・BOM つきでも読める', () => {
    expect(parseFrontmatter('﻿---\r\ntitle: t\r\ndate: 2026-01-02\r\n---\r\n本文')).toMatchObject({ ok: true, body: '本文' })
  })
})

describe('本文の分割（マクロの埋め込み）', () => {
  it('::macro[slug] の行で、Markdown とマクロに分ける', () => {
    expect(splitArticleBody('前の文章\n\n::macro[Abc12345]\n\n後ろの文章')).toEqual([
      { type: 'markdown', text: '前の文章' },
      { type: 'macro', slug: 'abc12345' },
      { type: 'markdown', text: '後ろの文章' },
    ])
  })
  it('コードブロックの中の ::macro は、書き方の例なので埋め込まない', () => {
    const segments = splitArticleBody('```\n::macro[abc12345]\n```\n\n::macro[def67890]')
    expect(segments.filter((s) => s.type === 'macro').map((s) => s.type === 'macro' && s.slug)).toEqual(['def67890'])
  })
  it('行の途中・余計な文字つきは、埋め込みではなくただの文字', () => {
    expect(splitArticleBody('見て ::macro[abc12345]').every((s) => s.type === 'markdown')).toBe(true)
  })
})

describe('Markdown の描画', () => {
  it('見出し・強調・コードを HTML にする', () => {
    const html = renderMarkdown('## 見出し\n\n**太字** と `code`')
    expect(html).toContain('<h2>見出し</h2>')
    expect(html).toContain('<strong>太字</strong>')
    expect(html).toContain('<code>code</code>')
  })
  it('直接書いた HTML は、タグとして通さず文字にする', () => {
    const html = renderMarkdown('<script>alert(1)</script>\n\nテキスト <b onclick="x()">太</b>')
    expect(html).not.toContain('<script>')
    expect(html).not.toContain('<b ')
    expect(html).toContain('&lt;script&gt;')
  })
  it('javascript: などの URL はリンクにせず、外部リンクは別タブ・noopener', () => {
    expect(renderMarkdown('[x](javascript:alert(1))')).not.toContain('href')
    expect(renderMarkdown('[x](//evil.example)')).not.toContain('href')
    const external = renderMarkdown('[公式](https://example.com/a?b=1&c=2)')
    expect(external).toContain('target="_blank" rel="noopener noreferrer"')
    expect(external).toContain('&amp;c=2')
    expect(renderMarkdown('[内](/macros/abc)')).toContain('<a href="/macros/abc">')
  })
  it('画像は http(s) とサイト内のパスだけ', () => {
    expect(renderMarkdown('![a](javascript:x)')).not.toContain('<img')
    expect(renderMarkdown('![図](/images/a.png)')).toContain('<img src="/images/a.png" alt="図"')
  })
})
