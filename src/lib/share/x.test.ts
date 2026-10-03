import { describe, expect, it } from 'vitest'
import { buildXShareUrl } from './x'

const decode = (shareUrl: string) => decodeURIComponent(new URL(shareUrl).searchParams.get('text') ?? '')

describe('X の共有 URL', () => {
  it('「マクロ名 URL #タグ…」の文面で、投稿画面を開く URL を作る', () => {
    const shareUrl = buildXShareUrl({ title: 'Lv91~95耐久40(CP489)', url: 'https://example.com/macros/abc12345', hashtags: ['FF14', 'マクロ工房'] })
    expect(shareUrl.startsWith('https://x.com/intent/post?text=')).toBe(true)
    expect(decode(shareUrl)).toBe('Lv91~95耐久40(CP489) https://example.com/macros/abc12345 #FF14 #マクロ工房')
  })
  it('タグの # は重複させず、空のタグは捨てる。タグが無くてもよい', () => {
    expect(decode(buildXShareUrl({ title: 't', url: 'https://e.com', hashtags: ['#a', '＃b', ' ', 'c'] }))).toBe('t https://e.com #a #b #c')
    expect(decode(buildXShareUrl({ title: 't', url: 'https://e.com', hashtags: [] }))).toBe('t https://e.com')
  })
  it('& や # などの特殊文字を含むタイトルも、1 つの text として渡る', () => {
    const shareUrl = buildXShareUrl({ title: 'A&B #1 100%', url: 'https://e.com', hashtags: [] })
    expect(new URL(shareUrl).searchParams.get('text')).toBe('A&B #1 100% https://e.com')
    expect([...new URL(shareUrl).searchParams.keys()]).toEqual(['text'])
  })
})
