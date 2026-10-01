import Link from 'next/link'
import { notFound } from 'next/navigation'
import { PublishedMacroReactions } from '@/components/PublishedMacroReactions'
import { findPublishedMacro, samplePublishedMacros } from '@/lib/published-macros/sample-data'
import { encodeDocument } from '@/lib/share/url'
import styles from './page.module.scss'

export function generateStaticParams() { return samplePublishedMacros.map((macro) => ({ slug: macro.slug })) }

export default async function PublishedMacroPage({ params }: PageProps<'/macros/[slug]'>) {
  const { slug } = await params
  const macro = findPublishedMacro(slug)
  if (!macro) notFound()

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <Link href="/macros" className={styles.backLink}>← 公開マクロ一覧に戻る</Link>
        <article className={styles.article}>
          <div className={styles.tags}>
            {macro.tags.map((tag) => (
              <Link key={tag} href={`/macros?q=${encodeURIComponent(`#${tag}`)}`} className={styles.tag}>#{tag}</Link>
            ))}
          </div>
          <h1 className={styles.title}>{macro.title}</h1>
          <p className={styles.description}>{macro.description}</p>
          <section className={styles.bodySection}>
            <h2 className={styles.bodyHeading}>マクロ本文</h2>
            <pre className={styles.code}>{macro.body}</pre>
            <p className={styles.disclaimer}>ゲーム内の動作を保証するものではありません。</p>
          </section>
          <div className={styles.openAction}>
            <Link href={`/?m=${encodeDocument({ version: 1, body: macro.body })}`} className={styles.openLink}>エディタで開く</Link>
          </div>
          <section className={styles.reactions}>
            <PublishedMacroReactions macroSlug={macro.slug} initialHelpful={macro.reactions.helpful} initialProblem={macro.reactions.problem} />
          </section>
          <footer className={styles.meta}>投稿者 {macro.authorHandle} · {macro.publishedAt}</footer>
        </article>
        <div className={styles.submitHint}>
          <Link href="/macros/submit" className={styles.submitLink}>このマクロをもとに公開する</Link>
        </div>
      </div>
    </main>
  )
}
