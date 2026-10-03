import type { Metadata } from 'next'
import { ActionButton } from '@/components/ActionButton'
import { ActionGroup } from '@/components/ActionGroup'
import { EditIcon, PreviewIcon } from '@/components/icons'
import { PageHero } from '@/components/PageHero'
import { SHORT_LINK } from '@/lib/share/short-links'
import styles from '../../status-page.module.scss'

export const metadata: Metadata = { title: '共有リンクが開けません', robots: { index: false } }

export default function ShortLinkNotFound() {
  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <PageHero compact eyebrow="LINK EXPIRED" title="共有リンクが開けません" lead={`共有リンクは、最後に開かれてから ${SHORT_LINK.expireDays} 日で期限切れになります。URL が違っている、または保存数の上限で古いものから消えた可能性もあります。`} />
        <nav aria-label="移動先" className={styles.links}>
          <ActionGroup>
            <ActionButton icon={<EditIcon />} variant="primary" href="/">マクロエディタへ</ActionButton>
            <ActionButton icon={<PreviewIcon />} variant="secondary" href="/macros">公開マクロを探す</ActionButton>
          </ActionGroup>
        </nav>
      </div>
    </main>
  )
}
