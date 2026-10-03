import { describe, expect, it } from 'vitest'
import { getDictionary } from '../commands/dictionary'
import { toLodestoneBBCode } from './lodestone'

const make = (body: string, title = 'テスト') =>
  toLodestoneBBCode({ title, body, url: 'https://example.com/macros/abc', brand: 'サイト' }, getDictionary())

describe('Lodestone 用 BB コード', () => {
  it('タイトル・[hb] で畳んだ本文・リンクの順に出す', () => {
    const lines = make('/p こんにちは').split('\n')
    expect(lines[0]).toBe('[b]テスト[/b]')
    expect(lines[1]).toBe('[hb]')
    expect(lines.at(-2)).toBe('[/hb]')
    expect(lines.at(-1)).toBe('[url=https://example.com/macros/abc]サイトで作成[/url]')
  })
  it('コマンドと代名詞だけ色を付け、地の文は色なし', () => {
    const body = make('/p こんにちは <t>').split('\n')[2]
    expect(body).toBe('[color=#1d4ed8]/p[/color] こんにちは [color=#7e22ce]<t>[/color]')
  })
  it('色を外すとマクロ本文に戻る（行数も保つ）', () => {
    const source = '/ac "かばう" <t>\n/wait 3\n\n/p おわり'
    const inner = make(source).split('\n').slice(2, -2).join('\n').replace(/\[\/?color[^\]]*\]/g, '')
    expect(inner).toBe(source)
  })
  it('タイトルの角括弧は全角にする', () => {
    expect(make('/p a', '[/b][url=x]').split('\n')[0]).toBe('[b]［/b］［url=x］[/b]')
  })
})
