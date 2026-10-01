import styles from './ActionGroup.module.scss'

// アクションボタン群の共通枠。ブロック全体をエリアの中央に揃え、狭い画面では折り返す。
// fill：置かれたブロックの幅いっぱいに、ボタンを等分で並べる（文言が改行落ちしないよう、狭い時だけ折り返す）。
export function ActionGroup({ children, className, fill }: { children: React.ReactNode; className?: string; fill?: boolean }) {
  const classes = [styles.group, fill && styles.fill, className].filter(Boolean).join(' ')
  return <div className={classes}>{children}</div>
}
