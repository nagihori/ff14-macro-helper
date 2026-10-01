import { lineRangeAt } from './parse'

// 行頭の「/」の直後にもう一度「/」（全角の「／」も）を1文字だけ打った時は、「/」ひとつに戻した本文を返す。
// 改行で「/」が自動で入るので、手癖で打ってしまう「//」を直す（「//」で始まるコマンドは無い）。
// 該当しなければ null。貼り付け・複数文字の入力・削除は対象外。
export function collapseDoubleSlash(previousBody: string, newValue: string, cursor: number): { body: string; cursor: number } | null {
  if (newValue.length !== previousBody.length + 1) return null
  const { start } = lineRangeAt(newValue, cursor)
  if (cursor !== start + 2 || newValue[start] !== '/') return null
  if (newValue[start + 1] !== '/' && newValue[start + 1] !== '／') return null
  return { body: newValue.slice(0, start + 1) + newValue.slice(start + 2), cursor: start + 1 }
}
