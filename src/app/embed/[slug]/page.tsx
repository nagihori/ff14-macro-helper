import type { Metadata } from 'next'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { EmbedCopyButton } from '@/components/EmbedCopyButton'
import { MacroCodeView } from '@/components/MacroCodeView'
import { MacroPreviewAccordion } from '@/components/MacroPreviewAccordion'
import { findPublishedMacro } from '@/lib/published-macros/repository'
import { BRAND_NAME } from '@/lib/site-config'
import styles from './page.module.scss'

// ほかのサイト（ブログ・攻略サイト）に iframe で貼るための、コンパクトなマクロ表示。
// 公開中のマクロだけ。ヘッダー・フッター・アクセス解析は出さない（HideInEmbed）。検索には載せない（本体の詳細ページと重複するため）。
// このルートだけ frame-ancestors を開けてある（next.config.ts）。?theme=light|dark で、貼り先に合わせて明暗を固定できる。
export const metadata: Metadata = { robots: { index: false, follow: false } }

export default async function EmbedPage({ params, searchParams }: PageProps<'/embed/[slug]'>) {
  const { slug } = await params
  const { theme } = await searchParams
  const macro = await findPublishedMacro(slug)
  if (!macro) notFound()
  const scheme = theme === 'light' || theme === 'dark' ? theme : 'light dark'
  const href = `/macros/${macro.slug}`

  return (
    <main className={styles.embed} style={{ colorScheme: scheme }}>
      <div className={styles.frame}>
        <header className={styles.header}>
          <h1 className={styles.title}>{macro.title}</h1>
          <EmbedCopyButton text={macro.body} className={styles.copy} />
        </header>
        <MacroCodeView body={macro.body} className={styles.code} />
        <MacroPreviewAccordion body={macro.body} />
        <footer className={styles.footer}>
          {/* 貼り付け先のページを離れずに本体を開けるよう、別タブで開く。参照元を渡さない。 */}
          <a href={href} target="_blank" rel="noopener" className={styles.open}>
            <Image src="/favicon.png" alt="" width={20} height={20} className={styles.logo} />
            {BRAND_NAME}で開く
          </a>
        </footer>
      </div>
    </main>
  )
}
