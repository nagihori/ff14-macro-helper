import Link from 'next/link'
import { MacroWorkbench } from '@/components/MacroWorkbench'
import styles from './page.module.scss'

export default function Home() {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>ff14-macro-helper</h1>
          <p className={styles.lead}>FFXIV マクロの編集・診断・ログプレビュー・共有をブラウザ内で完結します。</p>
        </div>
        <Link href="/macros" className={styles.libraryLink}>公開マクロを探す</Link>
      </header>
      <MacroWorkbench />
    </div>
  )
}
