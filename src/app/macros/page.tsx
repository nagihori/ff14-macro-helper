import Link from 'next/link'
import { auth } from '@/auth'
import { AuthButton } from '@/components/AuthButton'
import { PublishedMacroLibrary } from '@/components/PublishedMacroLibrary'
import { listPublishedMacros, listSuspendedMacros } from '@/lib/published-macros/repository'
import styles from './page.module.scss'

export const metadata = { title: '公開マクロ | ff14-macro-helper' }

export default async function MacroLibraryPage({ searchParams }: PageProps<'/macros'>) {
  const { q } = await searchParams
  const initialQuery = typeof q === 'string' ? q : ''
  const user = (await auth())?.user
  const admin = user?.isAdmin === true
  const [allMacros, suspended] = await Promise.all([listPublishedMacros(), user ? listSuspendedMacros({ id: user.id, isAdmin: admin }) : []])
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link href="/" className={styles.brand}>ff14-macro-helper</Link>
        <nav className={styles.actions} aria-label="ページ操作">
          <AuthButton redirectTo="/macros" />
          <Link href="/" className={styles.secondaryAction}>エディタに戻る</Link>
          <Link href="/macros/submit" className={styles.primaryAction}>公開する</Link>
        </nav>
      </header>
      <PublishedMacroLibrary allMacros={allMacros} initialQuery={initialQuery} />
      {suspended.length > 0 && (
        <section className={styles.suspended} aria-label="公開停止中のマクロ">
          <h2 className={styles.suspendedHeading}>{admin ? '公開停止中（管理者のみ）' : 'あなたの公開停止中のマクロ'}</h2>
          <ul>{suspended.map((macro) => <li key={macro.slug}><Link href={`/macros/${macro.slug}`} className={styles.suspendedLink}>{macro.title}</Link></li>)}</ul>
        </section>
      )}
    </div>
  )
}
