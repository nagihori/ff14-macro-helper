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

// 投稿者が決めるタイトルは、他人の BB コードに紛れ込まないよう角括弧を全角にする。
const sanitizeTitle = (title: string) => title.replace(/\[/g, '［').replace(/\]/g, '］')

export function toLodestoneBBCode(
  { title, body, url, brand }: { title: string; body: string; url: string; brand: string },
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
  // [hb] の直後・[/hb] の直前に改行を入れると、折り畳みの中に空行ができる（実機確認済み）ので、本文に直接つなぐ。
  return [`[b]${sanitizeTitle(title)}[/b]`, `[hb]${colored.join('\n')}[/hb]`, `[url=${url}]${brand}で作成[/url]`].join('\n')
}
