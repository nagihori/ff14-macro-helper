import { describe, expect, it } from 'vitest'
import { insertTemplate, isEditorEmpty } from './apply'
import { searchTemplates, type TemplateMacro } from './search'

const t = (slug: string, title: string, over: Partial<TemplateMacro> = {}): TemplateMacro => ({ slug, title, description: '', body: '/p a', tags: ['雛形'], ...over })

describe('雛形の検索', () => {
  const list = [
    t('a', '製作マクロの型', { tags: ['雛形', '製作'], body: '/ac 下地作業 <wait.3>' }),
    t('b', '冒頭の定番', { description: 'エラー音を消す', body: '/merror off\n/micon "ファスト"', tags: ['雛形'] }),
    t('c', 'パーティ挨拶', { body: '/p こんにちは' }),
  ]
  it('空の検索語では何も返さない', () => { expect(searchTemplates('  ', list)).toEqual([]) })
  it('タイトル・タグ・説明・本文のどれでも見つかり、先頭の / # や全角半角の違いは無視する', () => {
    expect(searchTemplates('製作', list).map((x) => x.slug)).toEqual(['a'])
    expect(searchTemplates('/merror', list).map((x) => x.slug)).toEqual(['b'])
    expect(searchTemplates('エラー', list).map((x) => x.slug)).toEqual(['b'])
    expect(searchTemplates('ＭＩＣＯＮ', list).map((x) => x.slug)).toEqual(['b'])
    expect(searchTemplates('#製作', list).map((x) => x.slug)).toEqual(['a'])
  })
  it('空白で区切った語はすべて含むものだけ（AND）で、タイトルへの一致が上に来る', () => {
    expect(searchTemplates('製作 下地', list).map((x) => x.slug)).toEqual(['a'])
    expect(searchTemplates('製作 パーティ', list)).toEqual([])
    const ranked = [t('x', '無関係', { body: 'p こんにちは' }), t('y', 'こんにちは集')]
    expect(searchTemplates('こんにちは', ranked).map((x) => x.slug)).toEqual(['y', 'x'])
  })
})

describe('雛形の差し込み', () => {
  it('空（「/」だけ）かどうか', () => {
    expect(isEditorEmpty('/')).toBe(true)
    expect(isEditorEmpty(' \n')).toBe(true)
    expect(isEditorEmpty('/p a')).toBe(false)
  })
  it('先頭に入れる：既存の行は下へ。「/」だけなら置き換える', () => {
    const r = insertTemplate('/p a\n/p b', 0, '/merror off\n/micon "x"', 'top')
    expect(r.ok && r.body).toBe('/merror off\n/micon "x"\n/p a\n/p b')
    const e = insertTemplate('/', 1, '/p a', 'top')
    expect(e.ok && e.body).toBe('/p a')
  })
  it('カーソルの行の下に入れる。その行が「/」だけなら置き換える', () => {
    const body = '/p a\n/p b'
    const r = insertTemplate(body, 2, '/x', 'after-cursor')
    expect(r.ok && r.body).toBe('/p a\n/x\n/p b')
    const blank = insertTemplate('/p a\n/', 6, '/x', 'after-cursor')
    expect(blank.ok && blank.body).toBe('/p a\n/x')
  })
  it('カーソルは、差し込んだ雛形の末尾に置く', () => {
    const r = insertTemplate('/p a\n/p b', 0, '/x\n/y', 'top')
    expect(r.ok && r.cursor).toBe('/x\n/y'.length)
  })
  it('行数の上限を超えるときは入れない', () => {
    const full = Array.from({ length: 15 }, (_, i) => `/p ${i}`).join('\n')
    expect(insertTemplate(full, 0, '/x', 'top')).toEqual({ ok: false, reason: 'too-many-lines' })
  })
})
