import { describe, expect, it } from 'vitest'
import { parseShortShareUrl } from './short-link-expand'

const hosts = ['example.com', 'localhost:3000']

describe('短縮共有 URL の判別', () => {
  it('このサイトのホストの /s/{id} から ID を取り出す', () => {
    expect(parseShortShareUrl('https://example.com/s/qem3m4m8', hosts)).toBe('qem3m4m8')
    expect(parseShortShareUrl('  http://localhost:3000/s/qem3m4m8/  ', hosts)).toBe('qem3m4m8')
  })
  it('別のホスト・長い共有 URL・形の違うものは null（そのまま扱う）', () => {
    expect(parseShortShareUrl('https://evil.example.org/s/qem3m4m8', hosts)).toBeNull()
    expect(parseShortShareUrl('https://example.com/?m=abc', hosts)).toBeNull()
    expect(parseShortShareUrl('https://example.com/s/short', hosts)).toBeNull()
    expect(parseShortShareUrl('https://example.com/s/qem3m4m8/extra', hosts)).toBeNull()
    expect(parseShortShareUrl('not a url', hosts)).toBeNull()
    expect(parseShortShareUrl('https://example.com/s/qem3m4m8', [null, undefined])).toBeNull()
  })
})
