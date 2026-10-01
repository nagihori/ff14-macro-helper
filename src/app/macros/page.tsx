import Link from 'next/link'
import { AuthButton } from '@/components/AuthButton'
import { PublishedMacroLibrary } from '@/components/PublishedMacroLibrary'
import { listPublishedMacros } from '@/lib/published-macros/repository'
import styles from './page.module.scss'

export const metadata = { title: '公開マクロ | ff14-macro-helper' }

export default async function MacroLibraryPage({ searchParams }: PageProps<'/macros'>) {
  const { q } = await searchParams
  const initialQuery = typeof q === 'string' ? q : ''
  const allMacros = await listPublishedMacros()
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
    </div>
  )
}
