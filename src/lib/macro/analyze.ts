import type { CommandDefinition, MacroAnalysis } from './types'
import { createDocument, parseLines } from './parse'
import { lint } from './lint'

// 単一の解析入口。診断・補完・ログはすべてここの結果から導く（AGENTS.md 守るべき設計）。
export function analyze(
  body: string,
  dictionary: CommandDefinition[],
): MacroAnalysis {
  const document = createDocument(body)
  const lines = parseLines(document.body)
  const diagnostics = lint(lines, dictionary)
  return { document, lines, diagnostics }
}
