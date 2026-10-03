import { describe, expect, it } from 'vitest'
import { buildEmbedCode, embedHeight } from './embed'

describe('埋め込みコード', () => {
  it('高さは行数に比例し、0 行でも 1 行ぶんは確保する', () => {
    expect(embedHeight(5) - embedHeight(4)).toBe(22)
    expect(embedHeight(0)).toBe(embedHeight(1))
  })
  it('src・高さ・allow・title を含み、title の特殊文字をエスケープする', () => {
    const code = buildEmbedCode({ siteUrl: 'https://example.com', slug: 'abc12345', title: 'A "B" <c> & d', lineCount: 15 })
    expect(code).toContain('src="https://example.com/embed/abc12345"')
    expect(code).toContain(`height="${embedHeight(15)}"`)
    expect(code).toContain('allow="clipboard-write"')
    expect(code).toContain('title="A &quot;B&quot; &lt;c&gt; &amp; d"')
  })
})
