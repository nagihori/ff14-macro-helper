// 全角相当の文字を半角の2倍として数える。ゲーム内の実際の文字数カウントとは
// 実機検証前のため「推定」として扱う（SPEC.md 文字数は実機検証してから固定する）。
function isWideCodePoint(codePoint: number): boolean {
  return (
    codePoint >= 0x1100 &&
    (codePoint <= 0x115f ||
      codePoint === 0x2329 ||
      codePoint === 0x232a ||
      (codePoint >= 0x2e80 && codePoint <= 0xa4cf && codePoint !== 0x303f) ||
      (codePoint >= 0xac00 && codePoint <= 0xd7a3) ||
      (codePoint >= 0xf900 && codePoint <= 0xfaff) ||
      (codePoint >= 0xfe30 && codePoint <= 0xfe6f) ||
      (codePoint >= 0xff00 && codePoint <= 0xff60) ||
      (codePoint >= 0xffe0 && codePoint <= 0xffe6) ||
      (codePoint >= 0x1f300 && codePoint <= 0x1f64f) ||
      (codePoint >= 0x1f900 && codePoint <= 0x1f9ff) ||
      (codePoint >= 0x20000 && codePoint <= 0x3fffd))
  )
}

export function halfWidthLength(text: string): number {
  let total = 0
  for (const char of text) {
    total += isWideCodePoint(char.codePointAt(0) ?? 0) ? 2 : 1
  }
  return total
}
