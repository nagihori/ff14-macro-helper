import type { CommandDefinition, Diagnostic, MacroLine } from './types'
import { findCommand } from '../commands/dictionary'
import { halfWidthLength } from './text-width'

// SPEC.md バリデーション表。文字数は暫定で全角を2・半角を1とした半角換算を使い「推定」として扱う。
export const MAX_LINES = 15
export const MAX_LINE_LENGTH = 180

export function lintLineCount(lines: MacroLine[]): Diagnostic[] {
  if (lines.length <= MAX_LINES) return []
  return [
    {
      severity: 'error',
      line: MAX_LINES + 1,
      code: 'line-count-exceeded',
      message: `マクロは ${MAX_LINES} 行までです（現在 ${lines.length} 行、推定値）。`,
    },
  ]
}

export function lintLineLength(lines: MacroLine[]): Diagnostic[] {
  return lines
    .map((line) => ({ line, length: halfWidthLength(line.raw) }))
    .filter(({ length }) => length > MAX_LINE_LENGTH)
    .map(({ line, length }) => ({
      severity: 'error' as const,
      line: line.line,
      code: 'line-length-exceeded',
      message: `1 行 ${MAX_LINE_LENGTH} 文字までです（現在 ${length} 文字、推定値）。`,
    }))
}

export function lintUnknownCommands(
  lines: MacroLine[],
  dictionary: CommandDefinition[],
): Diagnostic[] {
  return lines
    .filter((line) => line.commandToken !== null)
    .filter((line) => !findCommand(line.commandToken as string, dictionary))
    .map((line) => ({
      severity: 'warning',
      line: line.line,
      code: 'unknown-command',
      message: `コマンド「${line.commandToken}」は辞書にありません。`,
    }))
}

export function lint(
  lines: MacroLine[],
  dictionary: CommandDefinition[],
): Diagnostic[] {
  return [
    ...lintLineCount(lines),
    ...lintLineLength(lines),
    ...lintUnknownCommands(lines, dictionary),
  ]
}
