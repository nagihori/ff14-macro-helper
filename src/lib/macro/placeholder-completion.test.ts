import { describe, expect, it } from 'vitest'
import { getDictionary } from '../commands/dictionary'
import { analyze } from './analyze'
import { buildHighlight } from './highlight'
import { getPlaceholderCompletion } from './placeholder-completion'

const labels = (body: string) => getPlaceholderCompletion(body, body.length, getDictionary())?.candidates.map((candidate) => candidate.label)

describe('代名詞の補完', () => {
  it('<pos> は対象引数のないコマンド（チャット）でも、2 文字以上で補完する', () => {
    expect(labels('/p 今ここ po')).toEqual(['<pos>'])
    expect(labels('/p 今ここ p')).toBeUndefined()
    expect(labels('/p wh')).toEqual(['<where>'])
  })

  it('対象の短縮記法は対象引数を持つコマンドだけ。<f> と <1>〜<8> を持つ', () => {
    expect(labels('/ac "ケアル" f')).toContain('<f>')
    expect(labels('/ac "ケアル" 8')).toEqual(['<8>'])
    expect(labels('/ac "ケアル" ft')).toBeUndefined()
  })
})

describe('代名詞のハイライト', () => {
  it('<pos> と <f> と <1> は正しい代名詞、<ft> は存在しない代名詞', () => {
    const dictionary = getDictionary()
    const kindOf = (token: string) => {
      const body = `/p ${token}`
      const segments = buildHighlight(analyze(body, dictionary).lines, dictionary)[0].segments
      return segments.find((segment) => segment.text === token)?.kind
    }
    expect(kindOf('<pos>')).toBe('arg-placeholder')
    expect(kindOf('<f>')).toBe('arg-placeholder')
    expect(kindOf('<1>')).toBe('arg-placeholder')
    expect(kindOf('<ft>')).toBe('arg-placeholder-invalid')
  })
})
