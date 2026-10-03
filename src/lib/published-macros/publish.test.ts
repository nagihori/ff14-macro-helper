import { describe, expect, it } from 'vitest'
import { buildShareUrl } from '@/lib/share/url'
import { parseTags, validateMeta, validatePublish } from './publish'

const base = 'https://example.test/'
const url = (body: string, from?: string) => buildShareUrl({ version: 1, body }, base) + (from ? `&from=${from}` : '')
const input = (over: Partial<Parameters<typeof validatePublish>[0]> = {}) => ({ shareUrl: url('/p こんにちは'), title: 'タイトル', description: '', tags: 'パーティ, チャット', handle: 'Moco', ...over })

describe('タイトルの URL', () => {
  const errorsFor = (title: string) => validateMeta({ title, description: '', tags: '' }).errors

  it('http(s):// や www. を含むタイトルは弾く（全角も）', () => {
    expect(errorsFor('見て https://example.com')).toEqual(['タイトルに URL は使えません。説明に書いてください。'])
    expect(errorsFor('www.example.com')).toHaveLength(1)
    expect(errorsFor('ｈｔｔｐｓ：／／ｅｘａｍｐｌｅ．ｃｏｍ')).toHaveLength(1)
  })
  it('説明には URL を書ける', () => {
    expect(validateMeta({ title: 't', description: 'https://example.com', tags: '' }).errors).toEqual([])
  })
})

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

describe('validateMeta の説明（複数行）', () => {
  const errorsFor = (description: string) => validateMeta({ title: 't', description, tags: '' }).errors
  it('5 行までの改行を許し、改行コードをそろえる', () => {
    expect(errorsFor('a\nb\nc\nd\ne')).toEqual([])
    expect(validateMeta({ title: 't', description: 'a\r\nb', tags: '' }).description).toBe('a\nb')
  })
  it('6 行以上と空行は拒否する', () => {
    expect(errorsFor('a\nb\nc\nd\ne\nf')).toHaveLength(1)
    expect(errorsFor('a\n\nb')).toEqual(['説明に空行は使えません。'])
    expect(errorsFor('a\n \nb')).toEqual(['説明に空行は使えません。'])
  })
})

describe('validatePublish', () => {
  it('正しい入力を通し、アレンジ元の slug を取り出す', () => {
    const result = validatePublish(input({ shareUrl: url('/p こんにちは', 'party-ready-check') }), { needsHandle: true })
    expect(result).toMatchObject({ ok: true, value: { body: '/p こんにちは', originSlug: 'party-ready-check', tags: ['パーティ', 'チャット'] } })
  })

  it('共有URLが壊れていれば拒否する', () => {
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

  it('運営を名乗る公開名は、全角半角・大文字小文字・空白が違っても断り、ふつうの名前は通す', () => {
    for (const handle of ['管理人', '【公式】Moco', 'ＡＤＭＩＮ', 'Staff 01', 'Offi cial']) {
      const result = validatePublish(input({ handle }), { needsHandle: true })
      expect(result.ok, handle).toBe(false)
      if (!result.ok) expect(result.errors.join('\n')).toContain('紛らわしい')
    }
    for (const handle of ['Moco', 'なぎ', 'Nagi_01']) expect(validatePublish(input({ handle }), { needsHandle: true }).ok, handle).toBe(true)
  })
})
