import { describe, expect, it } from 'vitest'
import { analyze } from './analyze'
import { getDictionary } from '../commands/dictionary'
import { toLogPreview } from './log-preview'

const text = (body: string) => toLogPreview(analyze(body, getDictionary(), { complete: true }).lines, new Date(2026, 9, 2, 12, 0))[0].segments.map((segment) => segment.text).join('')

describe('発言者名の表示', () => {
  it('say / party は「**YourName** : 文章」', () => {
    expect(text('/p こんにちは')).toBe('**YourName** : こんにちは')
  })
  it('FC・リンクシェルは実機どおり「[FC]<名前>」で、名前だけ **YourName**', () => {
    expect(text('/fc こんにちは')).toBe('[FC]<**YourName**>こんにちは')
    expect(text('/l2 こんにちは')).toBe('[2]<**YourName**>こんにちは')
  })
})

describe('カスタムエモート（/emote）', () => {
  const entry = (body: string) => toLogPreview(analyze(body, getDictionary(), { complete: true }).lines, new Date(2026, 9, 2, 12, 0))[0]

  it('文章の前に自分の名前を付け、代名詞を展開し、システム色にする', () => {
    const result = entry('/emote は<t>に挨拶した。')
    expect(result.segments.map((segment) => segment.text).join('')).toBe('**YourName**は**TargetName**に挨拶した。')
    expect(result.kind).toBe('system')
    expect(result.unreproducible).toBeUndefined()
  })

  it('短縮名 /em も同じ。文章が空なら再現できない行', () => {
    expect(entry('/em を見つめた。').segments.map((segment) => segment.text).join('')).toBe('**YourName**を見つめた。')
    expect(entry('/em').unreproducible).toBe(true)
  })

  it('公式辞書のエモート（/smile）は再現できない行のまま', () => {
    expect(entry('/smile').unreproducible).toBe(true)
  })
})
