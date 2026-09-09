import type { CommandDefinition, HighlightLine, HighlightSegment, MacroLine } from './types'
import { findCommand } from '../commands/dictionary'
import { isCommandTokenSettled } from './parse'
import { SE_BASE, TARGET_SHORTHANDS, WAIT_BASE } from './placeholder-tokens'

// 引数部分の見た目上の区切り。ゲーム側の実際の引数仕様を検証するものではない。
const ARG_TOKEN = /"[^"]*"|<[^<>\s]+>|\b\d+(?:\.\d+)?\b/g

const TARGET_SHORTHAND_SET = new Set(TARGET_SHORTHANDS)

// 全角スペースは IME の変換ミスで紛れ込みやすく、ゲーム側では半角スペースとして
// 解釈されない可能性があるため、位置によらず常に強調する（SPEC.md バリデーション表 文字数・構文の周辺注意）。
const FULLWIDTH_SPACE = /　+/g

// <...> の中身から、既知の対象指定・待機・SE プレースホルダかどうかを判定する。
// <wait.*> <se.*> は末尾（条件・番号）が可変のプレースホルダ族として同じ特別扱いにする。
function classifyPlaceholder(token: string): 'arg-placeholder' | 'arg-placeholder-wait' | 'arg-placeholder-invalid' {
  const normalized = token.toLowerCase()
  const content = normalized.slice(1, -1)
  if (content.startsWith(`${WAIT_BASE}.`) || content.startsWith(`${SE_BASE}.`)) {
    return 'arg-placeholder-wait'
  }
  if (TARGET_SHORTHAND_SET.has(content)) return 'arg-placeholder'
  return 'arg-placeholder-invalid'
}

// 引数文字列を、文字列リテラル・<t> 等のプレースホルダ・数値・それ以外に分ける。
// セグメントを連結すると入力の text に戻ることを前提にする。
function tokenizeArgs(text: string): HighlightSegment[] {
  const segments: HighlightSegment[] = []
  let cursor = 0

  for (const match of text.matchAll(ARG_TOKEN)) {
    const start = match.index ?? 0
    if (start > cursor) {
      segments.push({ text: text.slice(cursor, start), kind: 'text' })
    }
    const token = match[0]
    const kind = token.startsWith('"')
      ? 'arg-string'
      : token.startsWith('<')
        ? classifyPlaceholder(token)
        : 'arg-number'
    segments.push({ text: token, kind })
    cursor = start + token.length
  }

  if (cursor < text.length) {
    segments.push({ text: text.slice(cursor), kind: 'text' })
  }

  return segments
}

// セグメントの種類にかかわらず、埋め込まれた全角スペースだけを別セグメントへ切り出す。
function splitFullwidthSpace(segments: HighlightSegment[]): HighlightSegment[] {
  const result: HighlightSegment[] = []

  for (const segment of segments) {
    let cursor = 0
    for (const match of segment.text.matchAll(FULLWIDTH_SPACE)) {
      const start = match.index ?? 0
      if (start > cursor) {
        result.push({ text: segment.text.slice(cursor, start), kind: segment.kind })
      }
      result.push({ text: match[0], kind: 'fullwidth-space' })
      cursor = start + match[0].length
    }
    if (cursor < segment.text.length) {
      result.push({ text: segment.text.slice(cursor), kind: segment.kind })
    }
  }

  return result
}

// 構文ハイライトは lint と同じトークン化結果を色分けに変換するだけの pure function。
// セグメントを連結すると raw に戻ることを前提にする（エディタの重ね書きが本文とずれないため）。
export function buildHighlight(
  lines: MacroLine[],
  dictionary: CommandDefinition[],
): HighlightLine[] {
  return lines.map((line) => {
    if (!line.commandToken) {
      const segments = line.raw ? [{ text: line.raw, kind: 'text' as const }] : []
      return { line: line.line, segments: splitFullwidthSpace(segments) }
    }

    const leadingSpaces = line.raw.length - line.raw.trimStart().length
    const tokenEnd = leadingSpaces + line.commandToken.length
    const known = Boolean(findCommand(line.commandToken, dictionary))
    // 未確定（"/" 単体や、まだ空白が続いていない打ちかけの名前）は地の文と同じ色にして、
    // 打鍵のたびに command-unknown の警告色・波線がちらつかないようにする。
    const tokenKind = known
      ? ('command-known' as const)
      : isCommandTokenSettled(line)
        ? ('command-unknown' as const)
        : ('text' as const)
    const rest = line.raw.slice(tokenEnd)

    const segments: HighlightSegment[] = [
      ...(leadingSpaces > 0
        ? [{ text: line.raw.slice(0, leadingSpaces), kind: 'text' as const }]
        : []),
      {
        text: line.raw.slice(leadingSpaces, tokenEnd),
        kind: tokenKind,
      },
      ...tokenizeArgs(rest),
    ]

    return { line: line.line, segments: splitFullwidthSpace(segments) }
  })
}
