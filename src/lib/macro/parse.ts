import type { MacroDocument, MacroLine } from './types'

// コマンド名は先頭の `/` から最初の空白までとする（SPEC.md 入力と URL）。
export function extractCommandToken(raw: string): string | null {
  const trimmed = raw.trimStart()
  if (!trimmed.startsWith('/')) return null
  const match = trimmed.match(/^(\S+)/)
  return match ? match[1] : null
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
