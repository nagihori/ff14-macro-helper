import { EditorGuide } from '@/components/EditorGuide'
import { PageHero } from '@/components/PageHero'
import { MacroWorkbench } from '@/components/MacroWorkbench'
import styles from './page.module.scss'

export default function Home() {
  return (
    <div className={styles.page}>
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
