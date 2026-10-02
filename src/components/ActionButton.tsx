import Link from 'next/link'
import { UI_TEXT } from '@/lib/ui-text'
import { CheckIcon, CrossIcon } from './icons'
import type { CopyState } from './useCopyFeedback'
import styles from './ActionButton.module.scss'

type Props = {
  icon: React.ReactNode
  children: React.ReactNode
  // ghost：枠も塗りも無い目立たない表示（主役にしたくない機能向け）。
  // publish：公開／投稿系（黄色の差し色）。
  variant?: 'primary' | 'secondary' | 'ghost' | 'publish'
  // コピー結果。copied / failed の間は、アイコンと文言がチェック／バツ＋結果文言に置き換わる。
  feedback?: CopyState
  title?: string
  disabled?: boolean
} & ({ href: string; onClick?: never } | { href?: never; onClick: () => void })

// 非エンジニア向けの、アイコン付きの丸ボタン（ボタン／リンク兼用）。
export function ActionButton({ icon, children, variant = 'primary', feedback = 'idle', title, disabled, href, onClick }: Props) {
  const className = `${styles.button} ${styles[variant]}`
  const content =
    feedback === 'copied' ? (
      <>
        <CheckIcon />
        {UI_TEXT.copied}
      </>
    ) : feedback === 'failed' ? (
      <>
        <CrossIcon />
        {UI_TEXT.copyFailed}
      </>
    ) : (
      <>
        {icon}
        {children}
      </>
    )

  if (href !== undefined) {
    return (
      <Link href={href} className={className} title={title}>
        {content}
      </Link>
    )
  }
  return (
    <button type="button" onClick={onClick} className={className} title={title} disabled={disabled} aria-live="polite">
      {content}
    </button>
  )
}
