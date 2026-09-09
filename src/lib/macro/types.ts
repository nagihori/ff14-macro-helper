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
  | 'say'
  | 'yell'
  | 'shout'
  | 'tell'
  | 'party'
  | 'alliance'
  | 'freecompany'
  | 'linkshell'
  | 'echo'
  | 'action'
  | 'system'
  | 'error'
  | 'unknown'

// ログプレビューの1行を構成するテキスト片。'placeholder' は <t> 等から解決した
// 表示（バッジ表示用）、'text' はそれ以外の地の文。
export type LogTextSegment = {
  text: string
  kind: 'text' | 'placeholder'
}

export type LogEntry = {
  line: number
  kind: LogEntryKind
  segments: LogTextSegment[]
  // /wait の累積から算出する疑似経過時間（HH:MM）。実時間の記録ではなくプレビュー専用。
  timestamp: string
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

// 構文ハイライト用。raw を分割したセグメントを連結すると元の行に戻る。
export type HighlightSegmentKind =
  | 'command-known'
  | 'command-unknown'
  | 'arg-placeholder'
  | 'arg-placeholder-wait'
  | 'arg-placeholder-invalid'
  | 'arg-string'
  | 'arg-number'
  | 'fullwidth-space'
  | 'text'

export type HighlightSegment = {
  text: string
  kind: HighlightSegmentKind
}

export type HighlightLine = {
  line: number
  segments: HighlightSegment[]
}

// カーソルが行頭のコマンド範囲にある時だけ存在する補完状態（SPEC.md 補完とチップヘルプ）。
// isExactMatch は「入力済みの文字列がそのまま辞書の正式名・短縮名と一致している」状態で、
// 一覧を出す必要はないが Tab で区切りの半角スペースだけは補いたい場合に使う。
export type CompletionState = {
  line: number
  rangeStart: number
  rangeEnd: number
  token: string
  candidates: CommandDefinition[]
  isExactMatch: boolean
} | null

// 確定すると insertText で置き換え、rangeStart からこのオフセット分だけ進めた位置へカーソルを戻す。
export type PlaceholderCandidate = {
  insertText: string
  caretOffset: number
  label: string
  description: string
}

// <t> <wait.s> のような山括弧プレースホルダの入力補助（引数側の補完）。
// コマンド名補完とは別の入力位置・確定方法を持つため型を分けている。
export type PlaceholderCompletionState = {
  line: number
  rangeStart: number
  rangeEnd: number
  candidates: PlaceholderCandidate[]
} | null
