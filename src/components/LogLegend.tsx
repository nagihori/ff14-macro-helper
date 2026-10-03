import type { LogEntry, LogEntryKind } from '@/lib/macro/types'
import { WarningIcon } from './icons'
import styles from './LogLegend.module.scss'

// ログプレビューの送信先の呼び名と、凡例に並べる順（色は styles/_mixins.scss の $log-tones）。
const LOG_KIND_LABEL: Record<LogEntryKind, string> = {
  say: '発言',
  party: 'パーティ',
  alliance: 'アライアンス',
  freecompany: 'FC',
  linkshell: 'LS',
  tell: 'TELL',
  shout: 'シャウト',
  yell: 'YELL',
  echo: 'エコー',
  action: 'アクション',
  system: 'システム',
  wait: '待機',
  error: 'エラー',
  unknown: '再現できない行',
}
const LOG_KINDS = Object.keys(LOG_KIND_LABEL) as LogEntryKind[]

// ログの下に出す凡例。いま出ている行に現れる送信先と、代名詞の表示（置き換わる値／そのまま）だけを示す。
export function LogLegend({ entries }: { entries: LogEntry[] }) {
  const kinds = new Set(entries.map((entry) => entry.kind))
  const placeholders = entries.flatMap((entry) => entry.segments.filter((segment) => segment.kind === 'placeholder'))
  const hasValue = placeholders.some((segment) => segment.text.startsWith('**'))
  const hasLiteral = placeholders.some((segment) => !segment.text.startsWith('**'))
  const shown = LOG_KINDS.filter((kind) => kinds.has(kind) && kind !== 'unknown' && kind !== 'wait')

  return (
    <div className={styles.legend}>
      {shown.length > 0 && (
        <p>
          文字色：
          {shown.map((kind, index) => (
            <span key={kind}>
              {index > 0 && '・'}
              <span className={styles.kind} data-kind={kind}>{LOG_KIND_LABEL[kind]}</span>
            </span>
          ))}
        </p>
      )}
      {hasValue && (
        <p>
          <span className={styles.placeholder}>**YourName**</span> のように <code>**</code> で囲んだ表示は、ゲーム内で名前や数値に置き換わる代名詞です。
        </p>
      )}
      {hasLiteral && (
        <p>
          <span className={styles.placeholder}>&lt;2&gt;</span> のように <code>&lt;&gt;</code> のまま出るものは、対象などの代名詞です。ゲーム内で置き換わります。
        </p>
      )}
      {kinds.has('wait') && (
        <p>
          時刻のない「N秒待機」の行は、<code>/wait</code> または行内の <code>&lt;wait.N&gt;</code> による待ちの目安です。
        </p>
      )}
      {entries.some((entry) => entry.unreproducible) && (
        <p>
          <WarningIcon /> が付いた行は、このプレビューでは再現できません。
        </p>
      )}
    </div>
  )
}
