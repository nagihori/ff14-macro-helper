import Link from 'next/link'
import { auth } from '@/auth'
import { AuthButton } from '@/components/AuthButton'
import { PublishedMacroLibrary } from '@/components/PublishedMacroLibrary'
import { listPublishedMacros, listSuspendedMacros } from '@/lib/published-macros/repository'
import { withDescriptionParts } from '@/lib/published-macros/resolve-descriptions'
import styles from './page.module.scss'

export const metadata = { title: '公開マクロ' }

export default async function MacroLibraryPage({ searchParams }: PageProps<'/macros'>) {
  const { q } = await searchParams
  const initialQuery = typeof q === 'string' ? q : ''
  const user = (await auth())?.user
  const admin = user?.isAdmin === true
  const [published, suspended] = await Promise.all([listPublishedMacros(), user ? listSuspendedMacros({ id: user.id, isAdmin: admin }) : []])
  // 説明内の他マクロの URL をタイトルリンクに展開する（一覧は全件を持っているので追加の問い合わせは要らない）。
  const allMacros = await withDescriptionParts(published)
  return (
    <div className={styles.page}>
      <PublishedMacroLibrary allMacros={allMacros} initialQuery={initialQuery} />
      {suspended.length > 0 && (
        <section className={styles.suspended} aria-label="公開停止中のマクロ">
          <h2 className={styles.suspendedHeading}>{admin ? '公開停止中（管理者のみ）' : 'あなたの公開停止中のマクロ'}</h2>
          <ul>{suspended.map((macro) => <li key={macro.slug}><Link href={`/macros/${macro.slug}`} className={styles.suspendedLink}>{macro.title}</Link></li>)}</ul>
        </section>
      )}
      <footer className={styles.footer}>
        <AuthButton redirectTo="/macros" />
      </footer>
    </div>
  )
}
