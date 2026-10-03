import { ActionButton } from './ActionButton'
import { EditIcon, PreviewIcon } from './icons'
import styles from './ArticleCta.module.scss'

// 記事の末尾の、小さな案内。読み終えた人が、そのままツールで試せるように。全記事に自動で付く（記事ごとに書かなくてよい）。
// 広告のようなバナーにはせず、記事の一部のような静かな見た目にする。
export function ArticleCta() {
  return (
    <aside className={styles.cta} aria-label="このツールについて">
      <p className={styles.text}>
        マクロの編集・診断・動作プレビューが、このツールですぐに試せます。公開マクロから、雛形を探すこともできます。
      </p>
      <div className={styles.actions}>
        <ActionButton icon={<EditIcon />} variant="primary" href="/">マクロエディタを開く</ActionButton>
        <ActionButton icon={<PreviewIcon />} variant="secondary" href="/macros" className={styles.secondary}>公開マクロを探す</ActionButton>
      </div>
    </aside>
  )
}
