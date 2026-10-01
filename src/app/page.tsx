import Link from 'next/link'
import { BRAND_NAME } from '@/lib/site-config'
import { EditorGuide } from '@/components/EditorGuide'
import { PageHero } from '@/components/PageHero'
import { PublishButton } from '@/components/PublishButton'
import { MacroWorkbench } from '@/components/MacroWorkbench'
import styles from './page.module.scss'

export default function Home() {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link href="/" className={styles.brand}>{BRAND_NAME}</Link>
        <nav className={styles.actions} aria-label="ページ操作">
          <Link href="/macros" className={styles.secondaryAction}>公開マクロを探す</Link>
          <PublishButton />
        </nav>
      </header>
      <div className={styles.hero}>
        <PageHero
          compact
          eyebrow="MACRO EDITOR"
          title="マクロエディタ"
          lead="FFXIVのゲーム内マクロを編集・診断。コマンドの検索とヘルプ表示もできます。"
        />
      </div>
      <MacroWorkbench />
      <div className={styles.guide}>
        <EditorGuide />
      </div>
    </div>
  )
}
