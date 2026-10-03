import { describe, expect, it } from 'vitest'
import { fitTags, textWidth } from './fit-tags'

describe('共有カードのタグの幅', () => {
  it('全角は 28、半角は 15 で見積もる', () => {
    expect(textWidth('#戦闘')).toBe(15 + 28 * 2)
    expect(textWidth('abc')).toBe(45)
  })
  it('幅に収まる分だけ、先頭から順に入れる', () => {
    const tags = ['#戦闘', '#ヒーラー', '#パーティー', '#白魔道士']
    // 71 + 24 + 127 + 24 + 155 = 401
    expect(fitTags(tags, 408)).toEqual(['#戦闘', '#ヒーラー', '#パーティー'])
    expect(fitTags(tags, 1000)).toEqual(tags)
    expect(fitTags(tags, 100)).toEqual(['#戦闘'])
    expect(fitTags(tags, 10)).toEqual([])
  })
  it('入りきらないタグで止める（短いあとのタグを飛び越して入れない）', () => {
    expect(fitTags(['#a', '#とても長いタグの名前です', '#b'], 100)).toEqual(['#a'])
  })
})
