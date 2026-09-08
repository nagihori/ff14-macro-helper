// SPEC.md のデータモデルに対応する型定義。

export type MacroDocument = {
  version: 1
  body: string
}

export type CommandCategory =
  | 'chat'
  | 'party_social'
  | 'target'
  | 'action_hotbar'
  | 'battle'
  | 'system'
  | 'macro'
  | 'config'
  | 'emote'
  | 'menu'
  | 'pronoun'

export type SupportLevel = 'reference_only' | 'lint' | 'log_preview'

export type CommandRule = {
  id: string
  description: string
  // ゲーム状態が必要な判定はここで表現せず、注意情報として扱う。
}

export type CommandDefinition = {
  id: string
  names: string[]
  category: CommandCategory
  signature: string
  description: string
  sourceUrl: string
  verifiedAt: string
  gameVersion: string
  support: SupportLevel
  rules: CommandRule[]
}

export type DiagnosticSeverity = 'error' | 'warning' | 'info'

export type Diagnostic = {
  severity: DiagnosticSeverity
  line: number
  column?: number
  code: string
  message: string
}

export type LogEntryKind =
  | 'shout'
  | 'party'
  | 'echo'
  | 'action'
  | 'system'
  | 'error'
  | 'unknown'

export type LogEntry = {
  line: number
  kind: LogEntryKind
  text: string
  isPreview: true
}

// 解析入口が返す、行・トークン化された中間表現。
export type MacroLine = {
  line: number
  raw: string
  commandToken: string | null
  argsText: string
}

export type MacroAnalysis = {
  document: MacroDocument
  lines: MacroLine[]
  diagnostics: Diagnostic[]
}
