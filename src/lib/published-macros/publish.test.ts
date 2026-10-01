import { describe, expect, it } from 'vitest'
import { buildShareUrl } from '@/lib/share/url'
import { parseTags, validateMeta, validatePublish } from './publish'

const base = 'https://example.test/'
const url = (body: string, from?: string) => buildShareUrl({ version: 1, body }, base) + (from ? `&from=${from}` : '')
const input = (over: Partial<Parameters<typeof validatePublish>[0]> = {}) => ({ shareUrl: url('/p こんにちは'), title: 'タイトル', description: '', tags: 'パーティ, チャット', handle: 'Moco', ...over })

describe('parseTags', () => {
  it('区切り・先頭の # ・重複を整える', () => {
    expect(parseTags('#パーティ, チャット、パーティ，')).toEqual(['パーティ', 'チャット'])
  })
})

describe('validateMeta', () => {
  it('編集用：整えた値を返し、制約違反はエラーにする', () => {
    expect(validateMeta({ title: ' 題 ', description: '', tags: '#a, b' })).toEqual({ title: '題', description: '', tags: ['a', 'b'], errors: [] })
    expect(validateMeta({ title: '', description: 'x'.repeat(201), tags: 'a b' }).errors).toHaveLength(3)
  })
})

describe('validatePublish', () => {
  it('正しい入力を通し、アレンジ元の slug を取り出す', () => {
    const result = validatePublish(input({ shareUrl: url('/p こんにちは', 'party-ready-check') }), { needsHandle: true })
    expect(result).toMatchObject({ ok: true, value: { body: '/p こんにちは', originSlug: 'party-ready-check', tags: ['パーティ', 'チャット'] } })
  })

  it('共有 URL が壊れていれば拒否する', () => {
    expect(validatePublish(input({ shareUrl: 'not a url' }), { needsHandle: false })).toMatchObject({ ok: false })
    expect(validatePublish(input({ shareUrl: base + '?m=!!!' }), { needsHandle: false })).toMatchObject({ ok: false })
    expect(validatePublish(input({ shareUrl: base }), { needsHandle: false })).toMatchObject({ ok: false })
  })

  it('16 行以上のマクロは lint エラーとして拒否する', () => {
    const body = Array.from({ length: 16 }, () => '/p a').join('\n')
    const result = validatePublish(input({ shareUrl: url(body) }), { needsHandle: false })
    expect(result.ok).toBe(false)
  })

  it('タイトル・タグ・公開名の制約を検証する', () => {
    const result = validatePublish(input({ title: '', tags: 'a b, 1,2,3,4,5', handle: '' }), { needsHandle: true })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.errors.join('\n')).toMatch(/タイトル[\s\S]*タグは 5 個[\s\S]*空白[\s\S]*公開名/)
  })

  it('公開名を覚えているユーザーは handle なしで通り、変更時は長さを検証する', () => {
    expect(validatePublish(input({ handle: '' }), { needsHandle: false }).ok).toBe(true)
    expect(validatePublish(input({ handle: 'Nagi' }), { needsHandle: false }).ok).toBe(true)
    expect(validatePublish(input({ handle: 'あ'.repeat(21) }), { needsHandle: false }).ok).toBe(false)
  })
})
