import type { MacroDocument, MacroLine } from './types'

// コマンド名は先頭の `/` から最初の空白までとする（SPEC.md 入力と URL）。
export function extractCommandToken(raw: string): string | null {
  const trimmed = raw.trimStart()
  if (!trimmed.startsWith('/')) return null
  const match = trimmed.match(/^(\S+)/)
  return match ? match[1] : null
}

// コマンド名を「打ち終えた」とみなせるかどうか。"/" 単体は入力直後から常に存在するため対象外にし、
// "/" + 1 文字以上のあとに半角スペースが続いた時点で「これ以上は確定した名前」として扱う
// （lintUnknownCommands・構文ハイライトの command-unknown 判定が、入力途中の一致しない文字列に
// 反応して毎打鍵ちらつくのを防ぐ）。
export function isCommandTokenSettled(line: MacroLine): boolean {
  if (!line.commandToken || line.commandToken.length <= 1) return false
  const trimmed = line.raw.trimStart()
  return trimmed[line.commandToken.length] === ' '
}

// カーソル位置を含む行の本文中の開始・終了オフセット（改行文字は含まない）。
// 補完系の各関数が同じ行境界の定義を共有するための共通ヘルパー。
export function lineRangeAt(body: string, cursor: number): { start: number; end: number } {
  const start = body.lastIndexOf('\n', cursor - 1) + 1
  const endIndex = body.indexOf('\n', start)
  const end = endIndex === -1 ? body.length : endIndex
  return { start, end }
}

export function parseLines(body: string): MacroLine[] {
  return body.split('\n').map((raw, index) => {
    const commandToken = extractCommandToken(raw)
    const argsText = commandToken
      ? raw.trimStart().slice(commandToken.length).trimStart()
      : ''
    return {
      line: index + 1,
      raw,
      commandToken,
      argsText,
    }
  })
}

export function createDocument(body: string): MacroDocument {
  return { version: 1, body }
}
