'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { recallLibraryPath, rememberLibraryPath } from '@/lib/tab-memory'
import { UI_TEXT } from '@/lib/ui-text'
import { ThemeToggle } from './ThemeToggle'
import styles from './SiteHeader.module.scss'

// 全ページ共通のヘッダー。ブランド名と、サイトの 2 つのモード（エディタ／ライブラリ）のタブ、ライト/ダークの切り替え。
// タブはルート遷移（/ と /macros 配下）だが、動きはタブにそろえる：開いていないタブは自分の最後のページに戻り（ライブラリは最後に開いていた
// /macros 配下のページ。lib/tab-memory.ts）、いま開いているタブをもう一度押したら入口に戻る。現在地は aria-current で示し、
// 規約など、どちらにも属さないページではどちらも選ばれない。
// 「ライブラリ」は /macros 配下（詳細・投稿・編集）すべて。
const TABS = [
  { href: '/', label: UI_TEXT.tabEditor, isCurrent: (pathname: string) => pathname === '/' },
  { href: '/macros', label: UI_TEXT.tabLibrary, isCurrent: (pathname: string) => pathname === '/macros' || pathname.startsWith('/macros/') },
]

// brandName は環境変数で差し替わる値（サーバー側でしか読めない）ので、layout から props で受け取る。
export function SiteHeader({ brandName }: { brandName: string }) {
  const pathname = usePathname()
  // ライブラリのタブが戻る先。描画の時点（サーバーと同じ）では入口にして、マウント後に覚えているページへ切り替える。
  const [libraryHref, setLibraryHref] = useState<string>(TABS[1].href)
  useEffect(() => {
    rememberLibraryPath(pathname)
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sessionStorage という外部システムとの同期（ページを移るたびに、覚えている先を読み直す）
    setLibraryHref(recallLibraryPath() ?? TABS[1].href)
  }, [pathname])
  // ブランド名は「いまいるモードの入口」へ戻る（ライブラリ配下では /macros、それ以外では /）。切り替えはタブが担う。
  const brandHref = TABS[1].isCurrent(pathname) ? TABS[1].href : TABS[0].href
  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <Link href={brandHref} className={styles.brand}>
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
                  {/* 開いていないタブは続きへ、いま開いているタブは入口へ。 */}
                  <Link href={!current && tab === TABS[1] ? libraryHref : tab.href} className={styles.tab} aria-current={current ? 'page' : undefined}>{tab.label}</Link>
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
