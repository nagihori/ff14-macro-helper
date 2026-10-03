import { describe, expect, it } from 'vitest'
import { buildAtomFeed } from './atom'

const base = { title: 'サイト', subtitle: '新着', alternateUrl: 'https://example.com/macros', feedUrl: 'https://example.com/macros/feed.xml' }
const entry = { url: 'https://example.com/macros/abc', title: 'A & B <c>', summary: '説明', author: 'Moco', tags: ['製作', '耐久40'], published: '2026-10-03T01:00:00Z' }

describe('Atom フィード', () => {
  it('エントリの項目を出し、XML の特殊文字をエスケープする', () => {
    const xml = buildAtomFeed({ ...base, entries: [entry] })
    expect(xml).toContain('<title>A &amp; B &lt;c&gt;</title>')
    expect(xml).toContain('<link href="https://example.com/macros/abc"/>')
    expect(xml).toContain('<category term="製作"/>')
    expect(xml).toContain('<author><name>Moco</name></author>')
    expect(xml).not.toContain('A & B')
  })
  it('全体の更新日時は、いちばん新しいエントリ', () => {
    const xml = buildAtomFeed({ ...base, entries: [entry, { ...entry, url: 'https://example.com/macros/def', published: '2026-10-04T01:00:00Z' }] })
    expect(xml).toContain('<updated>2026-10-04T01:00:00Z</updated>\n  <entry>')
  })
  it('エントリが空でも、読めるフィードを返す', () => {
    const xml = buildAtomFeed({ ...base, entries: [] })
    expect(xml).toContain('<updated>1970-01-01T00:00:00Z</updated>')
    expect(xml).toContain('</feed>')
  })
  it('XML で使えない制御文字を落とす', () => {
    expect(buildAtomFeed({ ...base, entries: [{ ...entry, summary: 'a\u0001b' }] })).toContain('<summary>ab</summary>')
  })
})
