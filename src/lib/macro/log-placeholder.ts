import type { LogTextSegment } from './types'

// docs/draft/placeholder-mapping.md で決めた代入ラベル。
// 「実際の値に置き換わる系」は **Label** 形式（読みやすいラベル）、
// 「読みやすい名前をつけようがない系」は元の記法のまま扱う（下の LITERAL_PATTERNS）。
const NAMED_LABELS: Record<string, string> = {
  t: 'TargetName',
  target: 'TargetName',
  tt: 'ttName',
  t2t: 'ttName',
  me: 'YourName',
  '0': 'YourName',
  r: 'ReplyName',
  reply: 'ReplyName',
  f: 'FocusTargetName',
  focus: 'FocusTargetName',
  lt: 'LastTargetName',
  lasttarget: 'LastTargetName',
  le: 'LastEnemyName',
  lastenemy: 'LastEnemyName',
  la: 'LastAttackerName',
  lastattacker: 'LastAttackerName',
  c: 'YourBuddyName',
  b: 'YourBuddyName',
  pet: 'YourPetName',
  mo: 'HoverName',
  mouse: 'HoverName',
  hp: 'YourMaxHP',
  hpp: 'YourHP%',
  mp: 'YourMaxMP',
  mpp: 'YourMP%',
  class: 'YourJob/Level',
  job: 'YourJob/Level',
  pos: 'YourPosition',
  where: 'YourPosition',
  buddyhp: 'YourBuddyMaxHP',
  bhp: 'YourBuddyMaxHP',
  buddyhpp: 'YourBuddyHP%',
  bhpp: 'YourBuddyHP%',
  targethpp: 'TargetHP%',
  thpp: 'TargetHP%',
  focushpp: 'FocusTargetHP%',
  fhpp: 'FocusTargetHP%',
  targetclass: 'TargetJob',
  tclass: 'TargetJob',
  targetjob: 'TargetJob',
  tjob: 'TargetJob',
  focusclass: 'FocusTargetJob',
  fclass: 'FocusTargetJob',
  focusjob: 'FocusTargetJob',
  fjob: 'FocusTargetJob',
}

// 読みやすい名前をつけようがない（番号・マーキング・SE番号など）ので、元の記法のまま
// プレースホルダとして扱うトークン。
const LITERAL_PATTERNS: RegExp[] = [
  /^[1-8]$/,
  /^attack[1-8]$/,
  /^bind[1-3]$/,
  /^stop[1-2]$/,
  /^(square|circle|plus|triangle)$/,
  /^se\.(1[0-6]|[1-9])$/,
  /^e[1-5]$/,
]

const RECAST_PATTERN = /^recast\..+$/i
const WAIT_PATTERN = /^wait\.(\d+)$/i

function resolveKnownToken(inner: string, original: string): string | null {
  const lower = inner.toLowerCase()
  if (lower in NAMED_LABELS) return `**${NAMED_LABELS[lower]}**`
  if (RECAST_PATTERN.test(inner)) return '**CDsec**'
  if (LITERAL_PATTERNS.some((pattern) => pattern.test(lower))) return original
  return null
}

// 実機確認済み（docs/draft/placeholder-mapping.md）：<wait.秒数> は行の途中にあっても
// エラーにならず、「指定秒数だけ待機した上で、それより後ろの文字列を破棄する」という
// 挙動になる。そのため見つかった時点で走査を打ち切り、以降の文字列は結果に含めない。
export function resolveLogText(rawText: string): { segments: LogTextSegment[]; extraWaitSeconds: number } {
  const segments: LogTextSegment[] = []
  let cursor = 0
  const tokenPattern = /<([^<>]+)>/g
  let match: RegExpExecArray | null

  while ((match = tokenPattern.exec(rawText))) {
    const [full, inner] = match
    const waitMatch = inner.match(WAIT_PATTERN)
    if (waitMatch) {
      if (match.index > cursor) {
        segments.push({ text: rawText.slice(cursor, match.index), kind: 'text' })
      }
      const seconds = Math.min(60, Number(waitMatch[1]))
      return { segments, extraWaitSeconds: seconds }
    }

    const replacement = resolveKnownToken(inner, full)
    if (replacement === null) continue // 未知の <...> はプレースホルダ扱いせず素通し

    if (match.index > cursor) {
      segments.push({ text: rawText.slice(cursor, match.index), kind: 'text' })
    }
    segments.push({ text: replacement, kind: 'placeholder' })
    cursor = match.index + full.length
  }

  if (cursor < rawText.length) {
    segments.push({ text: rawText.slice(cursor), kind: 'text' })
  }

  return { segments, extraWaitSeconds: 0 }
}
