import type { Metadata } from 'next'
import { connection } from 'next/server'
import { ActionButton } from '@/components/ActionButton'
import { ActionGroup } from '@/components/ActionGroup'
import { EditIcon, PreviewIcon } from '@/components/icons'
import { MacroCardSection } from '@/components/MacroCardSection'
import { PageHero } from '@/components/PageHero'
import { listRecommendedMacros } from '@/lib/published-macros/repository'
import styles from './status-page.module.scss'

export const metadata: Metadata = { title: 'ページが見つかりません', robots: { index: false } }

// 存在しない URL と、notFound() を呼んだページ（削除済み・公開停止中・URL の打ち間違いなど）に共通の表示。
// 行き止まりにしないため、公開マクロからおすすめを添える。DB に届かないときはおすすめだけ省く。
export default async function NotFound() {
  // ビルド時に固定せず、リクエストごとに作る（削除・停止されたマクロを勧めないため）。
  await connection()
  const recommended = await listRecommendedMacros().catch((error) => {
    console.error('[not-found] おすすめを読めませんでした', error)
    return []
  })

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <PageHero compact eyebrow="404 NOT FOUND" title="ページが見つかりません" lead="マクロが削除された、または公開が止まっている、URL が違っている、などが考えられます。" />
        <nav aria-label="移動先" className={styles.links}>
          <ActionGroup>
            <ActionButton icon={<PreviewIcon />} variant="primary" href="/macros">公開マクロを探す</ActionButton>
            <ActionButton icon={<EditIcon />} variant="secondary" href="/">マクロエディタへ</ActionButton>
          </ActionGroup>
        </nav>
        <MacroCardSection id="recommended-heading" heading="こんなマクロはいかがですか" items={recommended} />
      </div>
    </main>
  )
}
