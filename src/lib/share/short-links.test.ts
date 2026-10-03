import { describe, expect, it } from 'vitest'
import { bodyHash, creatorKey, isOriginSlug, isShortId, newShortId } from './short-links'

describe('短縮共有 URL の取り決め', () => {
  it('ID は英数字 8 文字で、自分で作ったものを受け付ける', () => {
    for (let i = 0; i < 50; i++) expect(isShortId(newShortId())).toBe(true)
    expect(isShortId('abc')).toBe(false)
    expect(isShortId('ABCDEFGH')).toBe(false)
    expect(isShortId('abcdefg0')).toBe(false) // 0 は使わない
    expect(isShortId('../etc/pw')).toBe(false)
  })
  it('同じ本文・同じアレンジ元は同じハッシュ、どちらかが違えば別', () => {
    expect(bodyHash('/p a', null)).toBe(bodyHash('/p a', null))
    expect(bodyHash('/p a', null)).not.toBe(bodyHash('/p b', null))
    expect(bodyHash('/p a', null)).not.toBe(bodyHash('/p a', 'abc'))
  })
  it('Cookie の値はそのまま保存せず、ハッシュにする', () => {
    expect(creatorKey('secret')).toMatch(/^[0-9a-f]{64}$/)
    expect(creatorKey('secret')).not.toContain('secret')
  })
  it('アレンジ元の slug の形', () => {
    expect(isOriginSlug('tmvecmtx')).toBe(true)
    expect(isOriginSlug('')).toBe(false)
    expect(isOriginSlug('a b')).toBe(false)
  })
})
