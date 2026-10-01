import type { CommandDefinition, MacroAnalysis } from './types'
import { createDocument, parseLines } from './parse'
import { lint } from './lint'

// 単一の解析入口。診断・補完・ログはすべてここの結果から導く（AGENTS.md 守るべき設計）。
// complete: コピー・共有・公開の直前など、入力を終えた本文として判定する（打ちかけの最終行も確定扱い）。
export function analyze(
  body: string,
  dictionary: CommandDefinition[],
  { complete = false }: { complete?: boolean } = {},
): MacroAnalysis {
  const document = createDocument(body)
  const lines = parseLines(document.body, complete)
  const diagnostics = lint(lines, dictionary)
  return { document, lines, diagnostics }
}
