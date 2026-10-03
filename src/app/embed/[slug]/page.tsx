import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { EmbedViewer } from '@/components/EmbedViewer'
import { MacroCodeView } from '@/components/MacroCodeView'
import { getDictionary } from '@/lib/commands/dictionary'
import { analyze } from '@/lib/macro/analyze'
import { toLogPreview } from '@/lib/macro/log-preview'
import { findPublishedMacro } from '@/lib/published-macros/repository'
import { buildEditorPath } from '@/lib/share/url'
import { BRAND_NAME } from '@/lib/site-config'
import styles from './page.module.scss'

// ほかのサイト（ブログ・攻略サイト）に iframe で貼るための、CodePen 風のコンパクトなマクロ表示（EmbedViewer）。
// 公開中のマクロだけ。ヘッダー・フッター・アクセス解析は出さない（HideInEmbed）。検索には載せない（本体の詳細ページと重複するため）。
// このルートだけ frame-ancestors を開けてある（next.config.ts）。既定はダークで、?theme=light（明るく）・?theme=auto（OS に従う）で変えられる。
export const metadata: Metadata = { robots: { index: false, follow: false } }

export default async function EmbedPage({ params, searchParams }: PageProps<'/embed/[slug]'>) {
  const { slug } = await params
  const { theme } = await searchParams
  const macro = await findPublishedMacro(slug)
  if (!macro) notFound()
  // 既定はダーク。light で明るく、auto で貼り先（OS）の設定に従う。
  const forced = theme === 'light' ? 'light' : theme === 'auto' ? null : 'dark'
  // 時刻は実時刻に展開せず [HH:mm] のまま見せる（サーバーで作れて、表示のずれも起きない）。
  const entries = toLogPreview(analyze(macro.body, getDictionary(), { complete: true }).lines).map((entry) => ({ ...entry, timestamp: 'HH:mm' }))

  return (
    <main className={styles.embed}>
      {/* 明暗の固定は <html> の data-theme で行う（トークンの light-dark() は、定義した要素の color-scheme で決まるため、枠への指定では効かない）。
          描画の前に実行されるよう、中身より先に置く。 */}
      {forced && <script dangerouslySetInnerHTML={{ __html: `document.documentElement.dataset.theme=${JSON.stringify(forced)}` }} />}
      <EmbedViewer
        title={macro.title}
        detailHref={`/macros/${macro.slug}`}
        body={macro.body}
        entries={entries}
        code={<MacroCodeView body={macro.body} />}
        editHref={buildEditorPath({ version: 1, body: macro.body }, macro.slug)}
        brandName={BRAND_NAME}
      />
    </main>
  )
}
