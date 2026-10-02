'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { UI_TEXT } from '@/lib/ui-text'
import { ThemeToggle } from './ThemeToggle'
import styles from './SiteHeader.module.scss'

// 全ページ共通のヘッダー。ブランド名と、サイトの 2 つのモード（エディタ／ライブラリ）のタブ、ライト/ダークの切り替え。
// タブはページ内の切り替えではなくルート遷移（/ と /macros 配下）。現在地は aria-current で示し、
// 規約など、どちらにも属さないページではどちらも選ばれない。
// 「ライブラリ」は /macros 配下（詳細・投稿・編集）すべて。
const TABS = [
  { href: '/', label: UI_TEXT.tabEditor, isCurrent: (pathname: string) => pathname === '/' },
  { href: '/macros', label: UI_TEXT.tabLibrary, isCurrent: (pathname: string) => pathname === '/macros' || pathname.startsWith('/macros/') },
]

// brandName は環境変数で差し替わる値（サーバー側でしか読めない）ので、layout から props で受け取る。
export function SiteHeader({ brandName }: { brandName: string }) {
  const pathname = usePathname()
  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <Link href="/" className={styles.brand}>
          {/* アイコンは飾り（隣にブランド名があるので読み上げない）。public/favicon.png を next/image が小さく変換して配る */}
          <Image src="/favicon.png" alt="" width={24} height={24} className={styles.logo} />
          {brandName}
        </Link>
        <nav aria-label="サイトの切り替え" className={styles.nav}>
          <ul className={styles.tabs}>
            {TABS.map((tab) => {
              const current = tab.isCurrent(pathname)
              return (
                <li key={tab.href}>
                  <Link href={tab.href} className={styles.tab} aria-current={current ? 'page' : undefined}>{tab.label}</Link>
                </li>
              )
            })}
          </ul>
        </nav>
        <div className={styles.theme}><ThemeToggle /></div>
      </div>
    </header>
  )
}
