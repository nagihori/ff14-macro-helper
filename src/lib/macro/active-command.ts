import type { CommandDefinition } from './types'
import { extractCommandToken, lineRangeAt } from './parse'
import { findCommand } from '../commands/dictionary'

// カーソルがある行のコマンドをチップヘルプ用に返す（SPEC.md 補完とチップヘルプ）。
// 補完候補の範囲制限とは異なり、行内のどこにカーソルがあっても対象にする。
export function getActiveCommand(
  body: string,
  cursor: number,
  dictionary: CommandDefinition[],
): CommandDefinition | undefined {
  const { start: lineStart, end: lineEnd } = lineRangeAt(body, cursor)
  if (cursor < lineStart || cursor > lineEnd) return undefined

  const raw = body.slice(lineStart, lineEnd)
  const token = extractCommandToken(raw)
  if (!token) return undefined

  return findCommand(token, dictionary)
}
