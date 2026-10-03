import { describe, expect, it } from 'vitest'
import { descriptionToPlainText, parseDescription } from './description-links'

const site = 'https://macro.example.test'

describe('parseDescription', () => {
  it('自サイトのマクロ URL を slug として取り出す', () => {
    expect(parseDescription(`前編：${site}/macros/abc12345 の続きです`, site)).toEqual([
      { type: 'text', text: '前編：' },
      { type: 'macro', slug: 'abc12345', raw: `${site}/macros/abc12345` },
      { type: 'text', text: ' の続きです' },
    ])
  })

  it('句読点・全角の閉じ括弧が続いても slug だけ取り出す', () => {
    const parts = parseDescription(`（${site}/macros/abc12345）。`, site)
    expect(parts.filter((part) => part.type === 'macro')).toHaveLength(1)
  })

  it('外部 URL・別ドメイン・?m= の共有URL・クエリやパスが続くものは展開しない', () => {
    for (const text of [
      'https://example.com/macros/abc12345',
      `${site}/?m=abc`,
      `${site}/macros/abc12345?x=1`,
      `${site}/macros/abc12345/edit`,
      `${site}/macros/submit?url=abc`,
    ]) {
      expect(parseDescription(text, site).some((part) => part.type === 'macro' && part.slug !== 'submit')).toBe(false)
    }
  })

  it('末尾スラッシュ付きの SITE_URL でも、localhost でも判別できる', () => {
    expect(parseDescription('http://localhost:3000/macros/abc12345', 'http://localhost:3000')).toHaveLength(1)
  })

  it('`コード`（バッククォート 1〜3 個）を code として取り出す。ふつうの文字は text', () => {
    expect(parseDescription('1行目に ```/micon 集中加工``` を足す', site)).toEqual([
      { type: 'text', text: '1行目に ' },
      { type: 'code', text: '/micon 集中加工' },
      { type: 'text', text: ' を足す' },
    ])
    expect(parseDescription('`a` と ``b`` と ```c```', site).filter((part) => part.type === 'code').map((part) => part.text)).toEqual(['a', 'b', 'c'])
  })

  it('対にならないバッククォート・開きと閉じの数が違うもの・改行をまたぐものは、そのまま文字', () => {
    for (const text of ['`だけ', '``a`', '```a``', '`a\nb`', '````a````']) {
      expect(parseDescription(text, site).every((part) => part.type === 'text')).toBe(true)
    }
  })

  it('コードの中の自サイトのマクロ URL は展開しない。外側は展開する', () => {
    const parts = parseDescription(`\`${site}/macros/abc12345\` と ${site}/macros/def67890`, site)
    expect(parts.filter((part) => part.type === 'macro').map((part) => part.type === 'macro' && part.slug)).toEqual(['def67890'])
    expect(parts[0]).toEqual({ type: 'code', text: `${site}/macros/abc12345` })
  })

  it('プレーンテキスト化は、コードはバッククォートを外した中身にする', () => {
    expect(descriptionToPlainText(parseDescription('先頭に ```/micon 集中加工``` を', site))).toBe('先頭に /micon 集中加工 を')
  })

  it('プレーンテキスト化は、タイトルと（削除済み）に置き換える', () => {
    expect(descriptionToPlainText([{ type: 'text', text: '続き：' }, { type: 'link', slug: 'a', title: '前編' }, { type: 'deleted', title: '旧版' }])).toBe('続き：前編旧版（削除済み）')
  })
})
