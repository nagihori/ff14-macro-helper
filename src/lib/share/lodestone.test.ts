import { describe, expect, it } from 'vitest'
import { getDictionary } from '../commands/dictionary'
import { toLodestoneBBCode } from './lodestone'

const make = (body: string, { title = 'テスト', description = '' } = {}) =>
  toLodestoneBBCode({ title, description, body, url: 'https://example.com/macros/abc', siteUrl: 'https://example.com', brand: 'サイト' }, getDictionary())

describe('Lodestone 用 BB コード', () => {
  it('タイトル（マクロへのリンク）・[hb] で畳んだ本文・サイトへのリンクの順に出す', () => {
    const lines = make('/p こんにちは').split('\n')
    expect(lines[0]).toBe('[size=14][b][url=https://example.com/macros/abc]テスト[/url][/b][/size]　[size=10]サイトで開きます[/size]')
    expect(lines[1]).toMatch(/^\[hb\]/)
    expect(lines.at(-1)).toBe('[/hb][right][url=https://example.com/]« サイトで作成[/url][/right]')
  })
  it('コマンドと代名詞だけ色を付け、地の文は色なし', () => {
    const line = make('/p こんにちは <t>').split('\n')[1]
    expect(line).toBe('[hb][color=#1d4ed8]/p[/color] こんにちは [color=#7e22ce]<t>[/color]')
  })
  it('説明文があれば [hb] の先頭に落ち着いた色で出し、なければ出さない', () => {
    expect(make('/p a', { description: '一行目\n二行目' }).split('\n').slice(1, 4)).toEqual([
      '[hb][color=#505063]一行目',
      '二行目[/color]',
      '[color=#1d4ed8]/p[/color] a',
    ])
    expect(make('/p a').split('\n')[1]).toBe('[hb][color=#1d4ed8]/p[/color] a')
  })
  it('色タグを外すとマクロ本文に戻る（行数も保つ）', () => {
    const source = '/ac "かばう" <t>\n/wait 3\n\n/p おわり'
    const inner = make(source).split('\n').slice(1, -1).join('\n').replace(/\[\/?(?:color[^\]]*|hb)\]/g, '')
    expect(inner).toBe(source)
  })
  it('タイトル・説明の角括弧は全角にする', () => {
    expect(make('/p a', { title: '[/b][url=x]', description: '[/hb]' }).split('\n').slice(0, 2).join('\n')).toContain('［/b］［url=x］')
    expect(make('/p a', { description: '[/hb]' })).toContain('［/hb］')
  })
})
