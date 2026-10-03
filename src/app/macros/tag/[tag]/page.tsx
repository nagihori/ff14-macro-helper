import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { MacroCardSection } from '@/components/MacroCardSection'
import { PageHero } from '@/components/PageHero'
import { listPublishedMacrosByTag } from '@/lib/published-macros/repository'
import { withDescriptionParts } from '@/lib/published-macros/resolve-descriptions'
import { MIN_INDEXABLE_TAG_MACROS, tagPath } from '@/lib/published-macros/tags'
import styles from './page.module.scss'

// URL のタグを文字列へ戻す。Next が先にデコードしている場合もあるので、デコードできなければそのまま使う
// （存在しないタグなら、そのあと 0 件で 404 になる）。
function readTag(raw: string): string {
  try {
    return decodeURIComponent(raw)
  } catch {
    return raw
  }
}

// タグ別一覧は、公開中のマクロが MIN_INDEXABLE_TAG_MACROS 件以上のときだけ検索に載せる（薄いページを増やさない）。
export async function generateMetadata({ params }: PageProps<'/macros/tag/[tag]'>): Promise<Metadata> {
  const tag = readTag((await params).tag)
  const macros = await listPublishedMacrosByTag(tag)
  if (macros.length === 0) return { title: 'タグが見つかりません', robots: { index: false } }
  const titles = macros.slice(0, 3).map((macro) => macro.title).join('、')
  const title = `#${tag} のFFXIVマクロ`
  const description = `「#${tag}」の公開マクロ ${macros.length} 件。${titles}${macros.length > 3 ? ' ほか' : ''}`
  return {
    title,
    description,
    alternates: { canonical: tagPath(tag) },
    robots: { index: macros.length >= MIN_INDEXABLE_TAG_MACROS, follow: true },
    openGraph: { type: 'website', title, description, url: tagPath(tag) },
  }
}

export default async function MacroTagPage({ params }: PageProps<'/macros/tag/[tag]'>) {
  const tag = readTag((await params).tag)
  const published = await listPublishedMacrosByTag(tag)
  if (published.length === 0) notFound()
  const macros = await withDescriptionParts(published)
  // 同じマクロに一緒に付いているタグへ、内部リンクを張る（多く一緒に付くものから）。
  const counts = new Map<string, number>()
  for (const macro of macros) for (const other of macro.tags) if (other !== tag) counts.set(other, (counts.get(other) ?? 0) + 1)
  const relatedTags = [...counts].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'ja')).map(([name]) => name)

  return (
    <main className={styles.page}>
      <PageHero compact eyebrow="TAG" title={`#${tag}`} lead={`「#${tag}」のついた公開マクロ ${macros.length} 件です。`} />
      <div className={styles.container}>
        <Link href="/macros" className={styles.backLink}>← 公開マクロ一覧に戻る</Link>
        {relatedTags.length > 0 && (
          <p className={styles.relatedTags}>
            一緒に付いているタグ：
            {relatedTags.map((name) => <Link key={name} href={tagPath(name)} className={styles.tag}>#{name}</Link>)}
          </p>
        )}
        <MacroCardSection id="tag-macros" heading="新しい順" items={macros} />
      </div>
    </main>
  )
}
