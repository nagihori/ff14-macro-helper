import { describe, expect, it } from 'vitest'
import { buildShareUrl, readOriginFromShareUrl, removeOriginFromShareUrl } from './url'

const doc = { version: 1 as const, body: '/e hi' }
const base = 'https://example.test/'

describe('アレンジ元（from）の持ち回り', () => {
  it('originSlug を渡すと from が付き、null で外れ、省略では base のまま残る', () => {
    const withFrom = buildShareUrl(doc, base, 'abc')
    expect(readOriginFromShareUrl(withFrom)).toBe('abc')
    expect(readOriginFromShareUrl(buildShareUrl(doc, withFrom, null))).toBeNull()
    expect(readOriginFromShareUrl(buildShareUrl(doc, withFrom))).toBe('abc')
  })

  it('removeOriginFromShareUrl は from だけを外し、不正な URL はそのまま返す', () => {
    const withFrom = buildShareUrl(doc, base, 'abc')
    const removed = removeOriginFromShareUrl(withFrom)
    expect(readOriginFromShareUrl(removed)).toBeNull()
    expect(new URL(removed).searchParams.get('m')).toBe(new URL(withFrom).searchParams.get('m'))
    expect(removeOriginFromShareUrl('not a url')).toBe('not a url')
  })
})
