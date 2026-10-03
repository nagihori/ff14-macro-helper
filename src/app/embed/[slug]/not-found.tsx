import type { Metadata } from 'next'
import { BRAND_NAME } from '@/lib/site-config'
import styles from './page.module.scss'

export const metadata: Metadata = { robots: { index: false } }

// 埋め込み先に出す、小さな案内。公開が止まった・削除されたマクロを貼った場合。
export default function EmbedNotFound() {
  return (
    <main className={styles.embed}>
      <p className={styles.missing}>このマクロは見つかりません（削除、または公開停止）。<a href="/macros" target="_blank" rel="noopener">{BRAND_NAME}で探す</a></p>
    </main>
  )
}
