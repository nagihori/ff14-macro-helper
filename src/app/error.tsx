'use client'

import { useEffect } from 'react'
import { ActionButton } from '@/components/ActionButton'
import { ActionGroup } from '@/components/ActionGroup'
import { EditIcon, PreviewIcon } from '@/components/icons'
import { PageHero } from '@/components/PageHero'
import styles from './status-page.module.scss'

// 想定外のエラー（DB に届かない場合など）の共通表示。layout（ヘッダー・フッター）の中に出る。
// 本番ではエラーの中身は伏せられ、digest（運営側のログと突き合わせる ID）だけが届く。
// retry：このセグメントを取り直して描画し直す（このバージョンの Next の名前。reset ではない）。
export default function ErrorPage({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <PageHero compact eyebrow="ERROR" title="うまく表示できませんでした" lead="一時的な不具合かもしれません。少し待ってから、もう一度お試しください。エディタは、サーバーにつながらなくても使えます。" />
        <nav aria-label="次の操作" className={styles.links}>
          <ActionGroup>
            <ActionButton icon={<PreviewIcon />} variant="primary" onClick={() => retry()}>もう一度読み込む</ActionButton>
            <ActionButton icon={<EditIcon />} variant="secondary" href="/">マクロエディタへ</ActionButton>
          </ActionGroup>
        </nav>
        {error.digest && <p className={styles.digest}>お問い合わせの際は、エラー ID「{error.digest}」をお知らせください。</p>}
      </div>
    </main>
  )
}
