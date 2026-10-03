import type { LogEntry, LogEntryKind, LogTextSegment, MacroLine } from './types'
import { resolveLogText } from './log-placeholder'

// このツールはプレイヤーの識別情報を持たないため、発言者名は「値に置き換わる系」の表記
// （docs/draft/placeholder-mapping.md の `**Label**`。<me> と同じ）でプレースホルダ表示する。
const PLACEHOLDER_NAME = '**YourName**'

// 実機の送信先チャンネルの表示形式。`prefix: null` は "名前 : 文章"、
// prefix ありは "[prefix]<名前>文章" という実機ログの2パターンに対応する。
// FC([FC]<Name>text)・say/party(Name : text)・alliance(prefixなし)・
// linkshell([1]〜[8]、番号省略時は[1])・
// cwlinkshell([CWLS1]〜[CWLS8]、番号省略時は[CWLS1]) は実機確認済み。
// pvpteam・beginner の prefix は未検証のため prefix なし（say/party と同じ表示）
// に倒している（要確認）。
const CHANNEL_META: Array<{ tokens: string[]; kind: LogEntryKind; prefix: string | null }> = [
  { tokens: ['/say', '/s'], kind: 'say', prefix: null },
  { tokens: ['/yell', '/y'], kind: 'yell', prefix: null },
  { tokens: ['/shout', '/sh'], kind: 'shout', prefix: null },
  { tokens: ['/tell', '/t'], kind: 'tell', prefix: null },
  { tokens: ['/reply', '/r'], kind: 'tell', prefix: null },
  { tokens: ['/party', '/p'], kind: 'party', prefix: null },
  { tokens: ['/alliance', '/a'], kind: 'alliance', prefix: null },
  { tokens: ['/pvpteam', '/pt'], kind: 'alliance', prefix: null }, // 未検証（要確認）
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
  { tokens: ['/beginner', '/b'], kind: 'linkshell', prefix: null }, // 未検証（要確認）
]

function findChannel(token: string): { kind: LogEntryKind; prefix: string | null } | null {
  const found = CHANNEL_META.find((group) => group.tokens.includes(token))
  return found ? { kind: found.kind, prefix: found.prefix } : null
}

const nameSegment: LogTextSegment = { text: PLACEHOLDER_NAME, kind: 'placeholder' }

// prefix ありは "[prefix]<名前>文章"、なしは "名前 : 文章" という実機ログの2パターン
// （docs/draft/placeholder-mapping.md）。文章側は <t> 等のプレースホルダを解決する。
function buildChatSegments(
  prefix: string | null,
  argsText: string,
): { segments: LogTextSegment[]; extraWaitSeconds: number } {
  const { segments: bodySegments, extraWaitSeconds } = resolveLogText(argsText)
  const segments: LogTextSegment[] = prefix
    ? [{ text: `[${prefix}]<`, kind: 'text' }, nameSegment, { text: '>', kind: 'text' }, ...bodySegments] // 実機は名前を山括弧で囲む
    : [nameSegment, { text: ' : ', kind: 'text' }, ...bodySegments]
  return { segments, extraWaitSeconds }
}

// 実機ログは秒までは表示しないため分単位（HH:mm）で揃える。
// 現在時刻を起点に /wait の累積秒数だけ進めることで、実行中のマクロっぽい表示にする。
function formatTimestamp(now: Date, elapsedSeconds: number): string {
  const shifted = new Date(now.getTime() + Math.max(0, elapsedSeconds) * 1000)
  return [shifted.getHours(), shifted.getMinutes()]
    .map((part) => String(part).padStart(2, '0'))
    .join(':')
}

function textSegments(text: string): LogTextSegment[] {
  return [{ text, kind: 'text' }]
}

// 現在時刻 + /wait の累積秒数から、行ごとの疑似実行時刻を導く。実際にその時刻へ
// 送信したログの記録ではなく、「いま実行したらこう見える」というプレビュー専用の値
// （docs/architecture.md）。extraWaitSeconds は行内に埋め込まれた <wait.秒数> の分
// （実機確認済み：それ以降の文字列を破棄した上で待機する）。
function toLogEntry(
  line: MacroLine,
  now: Date,
  elapsedSeconds: number,
): { entry: LogEntry; extraWaitSeconds: number } {
  const token = line.commandToken?.toLowerCase() ?? null
  const timestamp = formatTimestamp(now, elapsedSeconds)

  if (token === '/echo') {
    const { segments, extraWaitSeconds } = resolveLogText(line.argsText)
    return {
      entry: { line: line.line, kind: 'echo', segments, timestamp, delaySeconds: elapsedSeconds, isPreview: true },
      extraWaitSeconds,
    }
  }
  // カスタムエモート：打った文章の前に自分の名前が付き、システム色で出る
  // （例：/emote は<t>に挨拶した。 → **YourName**は**TargetName**に挨拶した。）。文章が空なら再現しない。
  if ((token === '/emote' || token === '/em') && line.argsText.trim()) {
    const { segments, extraWaitSeconds } = resolveLogText(line.argsText)
    return {
      entry: { line: line.line, kind: 'system', segments: [nameSegment, ...segments], timestamp, delaySeconds: elapsedSeconds, isPreview: true },
      extraWaitSeconds,
    }
  }
  if (token === '/action' || token === '/ac') {
    // 「アクション名 [対象]」。最初の <...> より前をアクション名（スペースを含んでもよい）、以降を対象とする。
    // 対象は <t> なら **TargetName**、<2> など対象が確定しないものは <> のまま「→ 対象」と添える
    // （実機のログ表現までは追わない方針）。
    const [, actionName = '', targetText = ''] = line.argsText.match(/^([^<]*?)\s*(<.*)?$/) ?? []
    const { segments: targetSegments, extraWaitSeconds } = resolveLogText(targetText)
    const segments = textSegments(`スキル：${actionName.replace(/^"|"$/g, '')}を発動`)
    if (targetSegments.length > 0) segments.push({ text: ' → ', kind: 'text' }, ...targetSegments)
    return {
      entry: { line: line.line, kind: 'action', segments, timestamp, delaySeconds: elapsedSeconds, isPreview: true },
      extraWaitSeconds,
    }
  }
  if (token === '/wait') {
    return {
      entry: {
        line: line.line,
        kind: 'wait',
        segments: textSegments(`${line.argsText || '?'}秒待機`),
        timestamp: '',
        delaySeconds: elapsedSeconds,
        isPreview: true,
      },
      extraWaitSeconds: 0,
    }
  }
  if (token !== null) {
    const channel = findChannel(token)
    if (channel) {
      const { segments, extraWaitSeconds } = buildChatSegments(channel.prefix, line.argsText)
      return {
        entry: {
          line: line.line,
          kind: channel.kind,
          segments,
          timestamp,
          delaySeconds: elapsedSeconds,
          isPreview: true,
        },
        extraWaitSeconds,
      }
    }
  }
  if (token === null) {
    return {
      entry: {
        line: line.line,
        kind: 'unknown',
        segments: textSegments(line.raw),
        timestamp,
        delaySeconds: elapsedSeconds,
        isPreview: true,
      },
      extraWaitSeconds: 0,
    }
  }

  // 未対応またはゲーム状態依存のコマンドは、再現できないことを明示する。
  return {
    entry: {
      line: line.line,
      kind: 'unknown',
      segments: textSegments(line.raw),
      timestamp,
      delaySeconds: elapsedSeconds,
      isPreview: true,
      unreproducible: true,
    },
    extraWaitSeconds: 0,
  }
}

export function toLogPreview(lines: MacroLine[], now: Date = new Date()): LogEntry[] {
  let elapsedSeconds = 0
  return lines.flatMap((line) => {
    const { entry, extraWaitSeconds } = toLogEntry(line, now, elapsedSeconds)
    const entries: LogEntry[] = [entry]
    // 行内の <wait.秒数> は、短い待ちだとアニメーションでは見落とすため「N秒待機」を別行で出す。
    if (extraWaitSeconds > 0) {
      entries.push({
        line: line.line,
        kind: 'wait',
        segments: textSegments(`${extraWaitSeconds}秒待機`),
        timestamp: '',
        delaySeconds: elapsedSeconds,
        isPreview: true,
      })
    }
    elapsedSeconds += extraWaitSeconds
    if (line.commandToken?.toLowerCase() === '/wait') {
      const waitSeconds = Number(line.argsText)
      if (Number.isFinite(waitSeconds) && waitSeconds > 0) {
        elapsedSeconds += waitSeconds
      }
    }
    return entries
  })
}
