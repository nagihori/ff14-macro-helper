import { describe, expect, it } from 'vitest'
import { buildEmbedCode, embedHeight } from './embed'

describe('埋め込みコード', () => {
  it('高さは行数に比例し、少ない行数は 5 行ぶん、多い行数は 15 行ぶんで止まる。15 行は 425px', () => {
    expect(embedHeight(7) - embedHeight(6)).toBe(21)
    expect(embedHeight(1)).toBe(embedHeight(5))
    expect(embedHeight(15)).toBe(425)
    expect(embedHeight(20)).toBe(425)
  })
  it('src・高さ・allow・title を含み、title の特殊文字をエスケープする', () => {
    const code = buildEmbedCode({ siteUrl: 'https://example.com', slug: 'abc12345', title: 'A "B" <c> & d', lineCount: 15 })
    expect(code).toContain('src="https://example.com/embed/abc12345"')
    expect(code).toContain(`height="${embedHeight(15)}"`)
    expect(code).toContain('allow="clipboard-write"')
    expect(code).toContain('title="A &quot;B&quot; &lt;c&gt; &amp; d"')
  })
})
