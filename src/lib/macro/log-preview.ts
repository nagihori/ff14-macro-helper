import type { LogEntry, LogEntryKind, MacroLine } from './types'

// このツールはプレイヤーの識別情報を持たないため、発言者名は他のプレースホルダ表記
// （<t> <wait.s> 等）と同じ山括弧の記法でプレースホルダ表示する。
const PLACEHOLDER_NAME = '<YourName>'

// 実機の送信先チャンネルの表示形式。`prefix: null` は "名前 : 文章"、
// prefix ありは "[prefix]<名前>文章" という実機ログの2パターンに対応する。
// FC([FC]<Name>text)・say/party(Name : text)・alliance(prefixなし)・
// pvpteam([PT])・linkshell([1]〜[8]、番号省略時は[1])・
// cwlinkshell([CWLS1]〜[CWLS8]、番号省略時は[CWLS1]) は実機確認済み。
// beginner の prefix（'BG'）のみ未検証の推測のまま（要確認）。
const CHANNEL_META: Array<{ tokens: string[]; kind: LogEntryKind; prefix: string | null }> = [
  { tokens: ['/say', '/s'], kind: 'say', prefix: null },
  { tokens: ['/yell', '/y'], kind: 'yell', prefix: null },
  { tokens: ['/shout', '/sh'], kind: 'shout', prefix: null },
  { tokens: ['/tell', '/t'], kind: 'tell', prefix: null },
  { tokens: ['/reply', '/r'], kind: 'tell', prefix: null },
  { tokens: ['/party', '/p'], kind: 'party', prefix: null },
  { tokens: ['/alliance', '/a'], kind: 'alliance', prefix: null },
  { tokens: ['/pvpteam', '/pt'], kind: 'alliance', prefix: 'PT' },
  { tokens: ['/freecompany', '/fc'], kind: 'freecompany', prefix: 'FC' },
  { tokens: ['/linkshell', '/l'], kind: 'linkshell', prefix: '1' },
  { tokens: ['/linkshell1', '/l1'], kind: 'linkshell', prefix: '1' },
  { tokens: ['/linkshell2', '/l2'], kind: 'linkshell', prefix: '2' },
  { tokens: ['/linkshell3', '/l3'], kind: 'linkshell', prefix: '3' },
  { tokens: ['/linkshell4', '/l4'], kind: 'linkshell', prefix: '4' },
  { tokens: ['/linkshell5', '/l5'], kind: 'linkshell', prefix: '5' },
  { tokens: ['/linkshell6', '/l6'], kind: 'linkshell', prefix: '6' },
  { tokens: ['/linkshell7', '/l7'], kind: 'linkshell', prefix: '7' },
  { tokens: ['/linkshell8', '/l8'], kind: 'linkshell', prefix: '8' },
  { tokens: ['/cwlinkshell', '/cwl'], kind: 'linkshell', prefix: 'CWLS1' },
  { tokens: ['/cwlinkshell1', '/cwl1'], kind: 'linkshell', prefix: 'CWLS1' },
  { tokens: ['/cwlinkshell2', '/cwl2'], kind: 'linkshell', prefix: 'CWLS2' },
  { tokens: ['/cwlinkshell3', '/cwl3'], kind: 'linkshell', prefix: 'CWLS3' },
  { tokens: ['/cwlinkshell4', '/cwl4'], kind: 'linkshell', prefix: 'CWLS4' },
  { tokens: ['/cwlinkshell5', '/cwl5'], kind: 'linkshell', prefix: 'CWLS5' },
  { tokens: ['/cwlinkshell6', '/cwl6'], kind: 'linkshell', prefix: 'CWLS6' },
  { tokens: ['/cwlinkshell7', '/cwl7'], kind: 'linkshell', prefix: 'CWLS7' },
  { tokens: ['/cwlinkshell8', '/cwl8'], kind: 'linkshell', prefix: 'CWLS8' },
  { tokens: ['/beginner', '/b'], kind: 'linkshell', prefix: 'BG' }, // 未検証（要確認）
]

function findChannel(token: string): { kind: LogEntryKind; prefix: string | null } | null {
  const found = CHANNEL_META.find((group) => group.tokens.includes(token))
  return found ? { kind: found.kind, prefix: found.prefix } : null
}

function formatChatText(prefix: string | null, text: string): string {
  return prefix ? `[${prefix}]${PLACEHOLDER_NAME}${text}` : `${PLACEHOLDER_NAME} : ${text}`
}

// 実機ログは秒までは表示しないため分単位（HH:mm）で揃える。
// 現在時刻を起点に /wait の累積秒数だけ進めることで、実行中のマクロっぽい表示にする。
function formatTimestamp(now: Date, elapsedSeconds: number): string {
  const shifted = new Date(now.getTime() + Math.max(0, elapsedSeconds) * 1000)
  return [shifted.getHours(), shifted.getMinutes()]
    .map((part) => String(part).padStart(2, '0'))
    .join(':')
}

// 現在時刻 + /wait の累積秒数から、行ごとの疑似実行時刻を導く。実際にその時刻へ
// 送信したログの記録ではなく、「いま実行したらこう見える」というプレビュー専用の値
// （docs/architecture.md）。
function toLogEntry(line: MacroLine, now: Date, elapsedSeconds: number): LogEntry {
  const token = line.commandToken?.toLowerCase() ?? null
  const timestamp = formatTimestamp(now, elapsedSeconds)

  if (token === '/echo') {
    return { line: line.line, kind: 'echo', text: line.argsText, timestamp, isPreview: true }
  }
  if (token === '/action' || token === '/ac') {
    return {
      line: line.line,
      kind: 'action',
      text: `スキル：${line.argsText.replace(/^"|"$/g, '')}を発動`,
      timestamp,
      isPreview: true,
    }
  }
  if (token === '/wait') {
    return {
      line: line.line,
      kind: 'system',
      text: `待機（${line.argsText || '?'} 秒）`,
      timestamp,
      isPreview: true,
    }
  }
  if (token !== null) {
    const channel = findChannel(token)
    if (channel) {
      return {
        line: line.line,
        kind: channel.kind,
        text: formatChatText(channel.prefix, line.argsText),
        timestamp,
        isPreview: true,
      }
    }
  }
  if (token === null) {
    return { line: line.line, kind: 'unknown', text: line.raw, timestamp, isPreview: true }
  }

  // 未対応またはゲーム状態依存のコマンドは、再現できないことを明示する。
  return {
    line: line.line,
    kind: 'unknown',
    text: `${line.raw}（このプレビューでは再現できません）`,
    timestamp,
    isPreview: true,
  }
}

export function toLogPreview(lines: MacroLine[], now: Date = new Date()): LogEntry[] {
  let elapsedSeconds = 0
  return lines.map((line) => {
    const entry = toLogEntry(line, now, elapsedSeconds)
    if (line.commandToken?.toLowerCase() === '/wait') {
      const waitSeconds = Number(line.argsText)
      if (Number.isFinite(waitSeconds) && waitSeconds > 0) {
        elapsedSeconds += waitSeconds
      }
    }
    return entry
  })
}
