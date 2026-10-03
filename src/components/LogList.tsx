import type { LogEntry } from '@/lib/macro/types'
import { WarningIcon } from './icons'
import styles from './LogList.module.scss'

// ログプレビューの行の一覧（エディタの動作プレビューと、詳細ページのプレビューで共有）。
// 送信先ごとの色は data-kind から LogList.module.scss が決める。
export function LogList({ entries }: { entries: LogEntry[] }) {
  return (
    <ul className={styles.log}>
      {entries.map((entry, index) => (
        <li key={index} className={styles.logEntry} data-kind={entry.kind}>
          {entry.unreproducible ? (
            <WarningIcon label="このプレビューでは再現できません" />
          ) : entry.kind === 'wait' ? null : (
            <>
              <span className={styles.logTime}>[{entry.timestamp}]</span>{' '}
            </>
          )}
          {entry.segments.map((segment, index) =>
            segment.kind === 'placeholder' ? (
              <span key={index} className={styles.logPlaceholder}>
                {segment.text}
              </span>
            ) : (
              <span key={index}>{segment.text}</span>
            ),
          )}
        </li>
      ))}
    </ul>
  )
}
