import Link from 'next/link'
import { PublishedMacroLibrary } from '@/components/PublishedMacroLibrary'
import styles from './page.module.scss'

export const metadata = { title: '公開マクロ | ff14-macro-helper' }

export default async function MacroLibraryPage({ searchParams }: PageProps<'/macros'>) {
  const { q } = await searchParams
  const initialQuery = typeof q === 'string' ? q : ''
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link href="/" className={styles.brand}>ff14-macro-helper</Link>
        <Link href="/" className={styles.backLink}>エディタに戻る</Link>
      </header>
      <PublishedMacroLibrary initialQuery={initialQuery} />
    </div>
  )
}
