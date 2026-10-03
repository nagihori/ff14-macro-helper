import { halfWidthLength } from '../macro/text-width'

// 共有カードの足元に並べるタグを、使える幅に収まる分だけにする（右下のアイコンと名前に、ぶつからないように）。
// 文字の幅は、フォント 28px の太字で、全角 28px・半角 15px の見積もり（実測の近似。ぴったりでなくてよく、少し余裕を見る）。
// 先頭から順に入れ、入りきらない最初のタグで止める（途中を飛ばして、あとのタグだけ入れることはしない）。
const FULL = 28
const HALF = 15
const GAP = 24

export const textWidth = (text: string) => halfWidthLength(text) * (FULL / 2) + [...text].filter((char) => char.charCodeAt(0) < 0x80).length * (HALF - FULL / 2)

export function fitTags(tags: string[], availableWidth: number): string[] {
  const fitted: string[] = []
  let used = 0
  for (const tag of tags) {
    const next = used + (fitted.length > 0 ? GAP : 0) + textWidth(tag)
    if (next > availableWidth) break
    fitted.push(tag)
    used = next
  }
  return fitted
}
