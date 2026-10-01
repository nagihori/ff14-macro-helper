import Link from 'next/link'
import { CheckIcon, CrossIcon } from './icons'
import type { CopyState } from './useCopyFeedback'
import styles from './ActionBar.module.scss'

// 操作帯（コードブロック上部）。GitHub や Qiita のコードブロックのような、小さなアイコン＋英小文字キャプションの帯。
// エンジニア向けの近道で、非エンジニア向けの ActionButton と同じ操作を別の場所から呼ぶ。
// onDark：ライトテーマでも暗いままの面（詳細ページのコードブロック）に載せるときの配色。
export function ActionBar({ label, onDark, children }: { label: string; onDark?: boolean; children: React.ReactNode }) {
  return (
    <div role="toolbar" aria-label={label} className={onDark ? `${styles.bar} ${styles.onDark}` : styles.bar}>
      {children}
    </div>
  )
}

type ItemProps = {
  icon: React.ReactNode
  caption: string
  // 読み上げ・ツールチップ用の正式な名前（例：「マクロテキストをコピー」）。
  title: string
  feedback?: CopyState
  disabled?: boolean
  active?: boolean
  'aria-keyshortcuts'?: string
} & ({ href: string; onClick?: never } | { href?: never; onClick: () => void })

export function ActionBarItem({ icon, caption, title, feedback = 'idle', disabled, active, href, onClick, 'aria-keyshortcuts': keyshortcuts }: ItemProps) {
  const content = (
    <>
      {feedback === 'copied' ? <CheckIcon /> : feedback === 'failed' ? <CrossIcon /> : icon}
      <span>{caption}</span>
    </>
  )
  if (href !== undefined) {
    return (
      <Link href={href} className={styles.item} title={title} aria-label={title} aria-keyshortcuts={keyshortcuts}>
        {content}
      </Link>
    )
  }
  return (
    <button type="button" onClick={onClick} className={styles.item} title={title} aria-label={title} aria-keyshortcuts={keyshortcuts} aria-pressed={active} disabled={disabled}>
      {content}
    </button>
  )
}
