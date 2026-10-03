import Link from 'next/link'
import { UI_TEXT } from '@/lib/ui-text'
import { FeedIcon } from './icons'
import styles from './SiteFooter.module.scss'

// 全ページ共通のフッター。規約とプライバシーポリシーへの入口と、新着フィード（RSS）・記事へのリンク。
// ログイン／ログアウトはセッションを読むため、ここ（全ページ共通）には置かず、必要なページ側に置く。
// 記事が 1 本でもあるときだけ「記事」へのリンクを出す。有無は next.config.ts がビルド時に調べて渡す（NEXT_PUBLIC_HAS_ARTICLES）。
const HAS_ARTICLES = process.env.NEXT_PUBLIC_HAS_ARTICLES === '1'

export function SiteFooter() {
  return (
    <footer className={styles.footer}>
      <nav aria-label="サイトの情報">
        <ul className={styles.links}>
          <li><a href="/macros/feed.xml" className={styles.feed}><FeedIcon />{UI_TEXT.feed}</a></li>
          {HAS_ARTICLES && <li><Link href="/articles">記事</Link></li>}
          <li><Link href="/terms">利用規約</Link></li>
          <li><Link href="/privacy">プライバシーポリシー</Link></li>
        </ul>
      </nav>
    </footer>
  )
}
