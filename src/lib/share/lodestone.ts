import type { CommandDefinition, HighlightSegmentKind } from '../macro/types'
import { analyze } from '../macro/analyze'
import { buildHighlight } from '../macro/highlight'

// Lodestone の掲示板 BB コード（[b] [color] [hb] [url]）に、構文ハイライト付きのマクロを書き出す。
// [hb] の中はダークテーマでも背景が明るいクリーム色のままなので、色は明るい背景で読めるもの
// （コントラスト比 4.5 以上）を固定で使う。エディタの色（styles/_mixins.scss の $highlight-tones）と
// 色相をそろえ、暗めの段（700〜800）にしている。
// 文字数の上限（10000）に収めるため、色を付けるのはコマンドと引数のトークンだけで、地の文は色なし。
// BB コードにはエスケープが無いので、本文に `[/hb]` のような文字列があると崩れる（通常のマクロには現れない）。
const BB_COLORS: Partial<Record<HighlightSegmentKind, string>> = {
  'command-known': '#1d4ed8',
  'command-known-emote': '#0f766e',
  'command-unknown': '#92400e',
  'arg-placeholder': '#7e22ce',
  'arg-placeholder-wait': '#be185d',
  'arg-placeholder-invalid': '#b91c1c',
  'arg-string': '#047857',
  'arg-number': '#0f766e',
}

// 投稿者が決めるタイトル・説明は、他人の BB コードに紛れ込まないよう角括弧を全角にする。
const sanitizeText = (text: string) => text.replace(/\[/g, '［').replace(/\]/g, '］')

// 説明文は本文と区別できる落ち着いた色にする（[hb] の明るい背景で読める濃さ）。
const DESCRIPTION_COLOR = '#505063'

// 形（渚さんが Lodestone のプレビューで整えたもの。docs/for_marketing.md の sample）：
//   [size=14][b][url=マクロのURL]タイトル[/url][/b][/size]　[size=10]ブランド名で開きます[/size]
//   [hb]（説明文）
//   （色付きの本文）
//   [/hb][right][url=サイトのURL]« ブランド名で作成[/url][/right]
export function toLodestoneBBCode(
  { title, description, body, url, siteUrl, brand }: { title: string; description: string; body: string; url: string; siteUrl: string; brand: string },
  dictionary: CommandDefinition[],
): string {
  const { lines } = analyze(body, dictionary, { complete: true })
  const colored = buildHighlight(lines, dictionary).map((line) => {
    // 同じ色が続く部分は 1 つのタグにまとめて、タグの分の文字数を減らす。
    const runs: { color?: string; text: string }[] = []
    for (const segment of line.segments) {
      const color = segment.text.trim() ? BB_COLORS[segment.kind] : undefined
      const last = runs[runs.length - 1]
      if (last && last.color === color) last.text += segment.text
      else runs.push({ color, text: segment.text })
    }
    return runs.map((run) => (run.color ? `[color=${run.color}]${run.text}[/color]` : run.text)).join('')
  })
  const note = description.trim() ? `[color=${DESCRIPTION_COLOR}]${sanitizeText(description.trim())}[/color]\n` : ''
  return [
    `[size=14][b][url=${url}]${sanitizeText(title)}[/url][/b][/size]　[size=10]${brand}で開きます[/size]`,
    `[hb]${note}${colored.join('\n')}`,
    `[/hb][right][url=${siteUrl}/]« ${brand}で作成[/url][/right]`,
  ].join('\n')
}
