import type { CommandDefinition, PlaceholderCompletionState } from './types'
import { extractCommandToken, lineRangeAt } from './parse'
import { findCommand } from '../commands/dictionary'
import {
  SE_BASE,
  TARGET_SHORTHAND_DESCRIPTIONS,
  TARGET_SHORTHANDS,
  WAIT_BASE,
} from './placeholder-tokens'

const WORD_CHAR = /[A-Za-z0-9]/
const WAIT_INSERT = `<${WAIT_BASE}.>`
const WAIT_CARET_OFFSET = WAIT_INSERT.length - 1 // "<wait." の直後（"." の後、">" の手前）
const SE_INSERT = `<${SE_BASE}.>`
const SE_CARET_OFFSET = SE_INSERT.length - 1 // "<se." の直後（"." の後、">" の手前）

// 対象指定の短縮記法（<t> <me> 等）は、対象引数を持つコマンド（現状は /action のみ）でだけ出す。
// 辞書の signature を見て判定するため、コマンド名を個別にハードコードしない。
// <wait.s> はコマンドを問わず文末に書けるため、この判定の対象外にする。
function commandHasTargetArgument(
  raw: string,
  dictionary: CommandDefinition[],
): boolean {
  const token = extractCommandToken(raw)
  if (!token) return false
  const command = findCommand(token, dictionary)
  return Boolean(command?.signature.toLowerCase().includes('target'))
}

// 山括弧の中や文字列リテラルの中で <t> <wait.s> 等を打つ手間を減らす入力補助。
// コマンド名の補完とは異なり、行内の引数トークンを対象にする。
export function getPlaceholderCompletion(
  body: string,
  cursor: number,
  dictionary: CommandDefinition[],
): PlaceholderCompletionState {
  const { start: lineStart, end: lineEnd } = lineRangeAt(body, cursor)
  const raw = body.slice(lineStart, lineEnd)
  const before = raw.slice(0, cursor - lineStart)

  // 既に <...> を書きかけている途中は対象外（二重にラップしない）。
  const lastOpen = before.lastIndexOf('<')
  const lastClose = before.lastIndexOf('>')
  if (lastOpen > lastClose) return null

  // "..." の中は対象外（アクション名等に紛れ込ませない）。
  const quoteCount = (before.match(/"/g) ?? []).length
  if (quoteCount % 2 === 1) return null

  let wordStart = cursor
  while (wordStart > lineStart && WORD_CHAR.test(body[wordStart - 1])) wordStart--
  let wordEnd = cursor
  while (wordEnd < lineEnd && WORD_CHAR.test(body[wordEnd])) wordEnd++
  if (wordStart === wordEnd) return null

  // コマンド名そのものは対象外（コマンド名補完側の担当）。
  const commandToken = extractCommandToken(raw)
  if (commandToken) {
    const leadingSpaces = raw.length - raw.trimStart().length
    const tokenStart = lineStart + leadingSpaces
    const tokenEnd = tokenStart + commandToken.length
    if (wordStart < tokenEnd && wordEnd > tokenStart) return null
  }

  const word = body.slice(wordStart, wordEnd)
  const normalized = word.toLowerCase()
  const lineNumber = body.slice(0, lineStart).split('\n').length

  if (WAIT_BASE.startsWith(normalized)) {
    return {
      line: lineNumber,
      rangeStart: wordStart,
      rangeEnd: wordEnd,
      candidates: [
        {
          insertText: WAIT_INSERT,
          caretOffset: WAIT_CARET_OFFSET,
          label: WAIT_INSERT,
          description: 'スキル使用可能待ち。ピリオドの後に条件を入力します。',
        },
      ],
    }
  }

  if (SE_BASE.startsWith(normalized)) {
    return {
      line: lineNumber,
      rangeStart: wordStart,
      rangeEnd: wordEnd,
      candidates: [
        {
          insertText: SE_INSERT,
          caretOffset: SE_CARET_OFFSET,
          label: SE_INSERT,
          description: 'SE を合図として再生。ピリオドの後に番号（1〜10）を入力します。',
        },
      ],
    }
  }

  if (!commandHasTargetArgument(raw, dictionary)) return null

  const matches = TARGET_SHORTHANDS.filter((shorthand) => shorthand.startsWith(normalized))
  if (matches.length === 0) return null

  return {
    line: lineNumber,
    rangeStart: wordStart,
    rangeEnd: wordEnd,
    candidates: matches.map((shorthand) => {
      const insertText = `<${shorthand}>`
      return {
        insertText,
        caretOffset: insertText.length,
        label: insertText,
        description: TARGET_SHORTHAND_DESCRIPTIONS[shorthand],
      }
    }),
  }
}
