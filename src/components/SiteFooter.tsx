import Link from 'next/link'
import styles from './SiteFooter.module.scss'

// 全ページ共通のフッター。規約とプライバシーポリシーへの入口。
// ログイン／ログアウトはセッションを読むため、ここ（全ページ共通）には置かず、必要なページ側に置く。
export function SiteFooter() {
  return (
    <footer className={styles.footer}>
      <nav aria-label="サイトの情報">
        <ul className={styles.links}>
          <li><Link href="/terms">利用規約</Link></li>
          <li><Link href="/privacy">プライバシーポリシー</Link></li>
        </ul>
      </nav>
    </footer>
  )
}
