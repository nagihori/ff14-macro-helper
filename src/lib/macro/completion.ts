import type { CommandDefinition, CompletionState } from './types'
import { extractCommandToken, lineRangeAt } from './parse'
import { suggestCommands } from '../commands/dictionary'

// カーソルが行頭のコマンド範囲にある時だけ候補を返す（SPEC.md 補完とチップヘルプ）。
// UI はここで返した範囲・候補をそのまま使い、独自にトークンの境界を判定しない。
export function getCompletionState(
  body: string,
  cursor: number,
  dictionary: CommandDefinition[],
): CompletionState {
  const { start: lineStart, end: lineEnd } = lineRangeAt(body, cursor)
  const raw = body.slice(lineStart, lineEnd)

  const token = extractCommandToken(raw)
  if (!token) return null

  const leadingSpaces = raw.length - raw.trimStart().length
  const rangeStart = lineStart + leadingSpaces
  const rangeEnd = rangeStart + token.length

  if (cursor < rangeStart || cursor > rangeEnd) return null

  const candidates = suggestCommands(token, dictionary)
  if (candidates.length === 0) return null

  const isExactMatch =
    candidates.length === 1 &&
    candidates[0].names.some((name) => name.toLowerCase() === token.toLowerCase())

  const lineNumber = body.slice(0, lineStart).split('\n').length
  return { line: lineNumber, rangeStart, rangeEnd, token, candidates, isExactMatch }
}

// 候補を確定する際、入力済みの文字列と完全一致する別名があればそれを優先する
// （例: "/ac" まで打ち切った状態では "/action" ではなく "/ac" のまま確定する）。
// 完全一致が無ければ前方一致した別名を使う。
export function resolveCompletionName(command: CommandDefinition, token: string): string {
  const normalized = token.toLowerCase()
  return (
    command.names.find((name) => name.toLowerCase() === normalized) ??
    command.names.find((name) => name.toLowerCase().startsWith(normalized)) ??
    command.names[0]
  )
}

// 補完確定時、本文を書き換えて次のカーソル位置を返す。
// 続けて引数を打てるよう、コマンド名の直後にすでに区切り（半角スペース・改行）が
// ない場合だけ半角スペースを補う。
export function applyCompletion(
  body: string,
  completion: NonNullable<CompletionState>,
  command: CommandDefinition,
): { body: string; cursor: number } {
  const name = resolveCompletionName(command, completion.token)
  const remainder = body.slice(completion.rangeEnd)
  const needsSeparator = remainder.length === 0 || !/^[ \n]/.test(remainder)
  const separator = needsSeparator ? ' ' : ''

  return {
    body: body.slice(0, completion.rangeStart) + name + separator + remainder,
    cursor: completion.rangeStart + name.length + separator.length,
  }
}
