import type { LogEntry, MacroLine } from './types'

// ログ変換はシミュレータではなく pure function（docs/architecture.md ログプレビュー）。
export function toLogEntry(line: MacroLine): LogEntry {
  const token = line.commandToken?.toLowerCase() ?? null

  if (token === '/shout' || token === '/sh') {
    return { line: line.line, kind: 'shout', text: line.argsText, isPreview: true }
  }
  if (token === '/party' || token === '/p') {
    return { line: line.line, kind: 'party', text: line.argsText, isPreview: true }
  }
  if (token === '/echo') {
    return { line: line.line, kind: 'echo', text: line.argsText, isPreview: true }
  }
  if (token === '/action' || token === '/ac') {
    return {
      line: line.line,
      kind: 'action',
      text: `スキル：${line.argsText.replace(/^"|"$/g, '')}を発動`,
      isPreview: true,
    }
  }
  if (token === '/wait') {
    return {
      line: line.line,
      kind: 'system',
      text: `待機（${line.argsText || '?'} 秒）`,
      isPreview: true,
    }
  }
  if (token === null) {
    return { line: line.line, kind: 'unknown', text: line.raw, isPreview: true }
  }

  // 未対応またはゲーム状態依存のコマンドは、再現できないことを明示する。
  return {
    line: line.line,
    kind: 'unknown',
    text: `${line.raw}（このプレビューでは再現できません）`,
    isPreview: true,
  }
}

export function toLogPreview(lines: MacroLine[]): LogEntry[] {
  return lines.map(toLogEntry)
}
