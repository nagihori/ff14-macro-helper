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

describe('行内の <wait.秒数>', () => {
  const preview = (body: string) => toLogPreview(analyze(body, getDictionary(), { complete: true }).lines, new Date(2026, 9, 2, 12, 0))

  it('その行の直後に、時刻なしの「N秒待機」を別行で出す', () => {
    const [say, wait, next] = preview('/p 準備<wait.3>\n/p 開始')
    expect(say.segments.map((segment) => segment.text).join('')).toBe('**YourName** : 準備')
    expect(wait.kind).toBe('wait')
    expect(wait.timestamp).toBe('')
    expect(wait.segments.map((segment) => segment.text).join('')).toBe('3秒待機')
    expect(wait.delaySeconds).toBe(0)
    expect(next.delaySeconds).toBe(3)
  })
  it('独立行の /wait も同じ「N秒待機」（時刻なし）にする', () => {
    const [wait, next] = preview('/wait 2\n/p 開始')
    expect(wait.kind).toBe('wait')
    expect(wait.timestamp).toBe('')
    expect(wait.segments.map((segment) => segment.text).join('')).toBe('2秒待機')
    expect(next.delaySeconds).toBe(2)
  })
  it('待機がなければ行は増えない', () => {
    expect(preview('/p a\n/p b')).toHaveLength(2)
  })
})

describe('/action の対象表示', () => {
  const action = (body: string) => text(body)

  it('<t> は「→ **TargetName**」に展開する', () => {
    expect(action('/ac かばう <t>')).toBe('スキル：かばうを発動 → **TargetName**')
  })
  it('<2> などは展開せず <> のまま添える', () => {
    expect(action('/ac かばう <2>')).toBe('スキル：かばうを発動 → <2>')
  })
  it('スペースを含む名前は、<> より前をすべてアクション名にする', () => {
    expect(action('/ac Fast Blade <t>')).toBe('スキル：Fast Bladeを発動 → **TargetName**')
    expect(action('/ac Fast Blade')).toBe('スキル：Fast Bladeを発動')
  })
  it('対象なし・引用符つきの名前', () => {
    expect(action('/ac "ファイア"')).toBe('スキル：ファイアを発動')
  })
})
