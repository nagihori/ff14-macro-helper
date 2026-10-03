import type { Metadata } from 'next'
import { EditorGuide } from '@/components/EditorGuide'
import { PageHero } from '@/components/PageHero'
import { MacroWorkbench } from '@/components/MacroWorkbench'
import { loadTemplates } from '@/lib/published-macros/templates'
import { decodeDocument } from '@/lib/share/url'
import { BRAND_NAME } from '@/lib/site-config'
import styles from './page.module.scss'

// 共有 URL（/?m=…）を貼ったときの共有カード。m のマクロから title・description・画像（/og/share）を作る。
// m が無い（ふつうのトップ）ときは何も返さず、layout の既定のままにする。検索には載せない（共有 URL は無数にあるため）。
// 画像は URL の中のマクロをその場で描く（DB は読まない。app/og/share/route.tsx）。
const MAX_PARAM_LENGTH = 12000

export async function generateMetadata({ searchParams }: PageProps<'/'>): Promise<Metadata> {
  const { m } = await searchParams
  if (typeof m !== 'string') return {}
  const robots = { index: false, follow: false }
  const decoded = m.length <= MAX_PARAM_LENGTH ? decodeDocument(m) : null
  if (!decoded || !decoded.ok) return { robots }

  const lines = decoded.document.body.split('\n')
  const title = `共有されたマクロ（${lines.length} 行）`
  // 冒頭の行をつなげて説明にする（長ければ切る）。
  const joined = lines.map((line) => line.trim()).filter(Boolean).join(' / ')
  const description = joined.length > 110 ? `${joined.slice(0, 109)}…` : joined || 'FFXIV マクロ'
  const image = `/og/share?m=${encodeURIComponent(m)}`
  return {
    // トップと layout は同じ階層なので、title のテンプレート（| サイト名）は効かない。ここで付ける。
    title: { absolute: `${title} | ${BRAND_NAME}` },
    description,
    robots,
    openGraph: { type: 'website', title, description, images: [{ url: image, width: 1200, height: 630 }] },
    twitter: { card: 'summary_large_image', title, description, images: [image] },
  }
}

export default async function Home() {
  // 雛形（タグ「雛形」の公開マクロ）は、サーバーが 1 時間ごとに取り直して渡す。DB に届かなければ空で、雛形なしで動く。
  const templates = await loadTemplates()
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
      <MacroWorkbench templates={templates} />
      <div className={styles.guide}>
        <EditorGuide />
      </div>
    </div>
  )
}
