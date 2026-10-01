import Link from 'next/link'
import { notFound } from 'next/navigation'
import { auth } from '@/auth'
import { AdminMacroControls } from '@/components/AdminMacroControls'
import { CopyMacroButton } from '@/components/CopyMacroButton'
import { PublishedMacroReactions } from '@/components/PublishedMacroReactions'
import { findMacroIncludingSuspended, findPublishedMacro, findRelatedMacros } from '@/lib/published-macros/repository'
import { buildEditorPath } from '@/lib/share/url'
import styles from './page.module.scss'

// 一覧用に件数だけを示す線画アイコン（現在の文字色に従う）。
const iconProps = { width: 14, height: 14, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true } as const
function ThumbIcon() { return <svg {...iconProps}><path d="M7 11v9H4v-9zM7 11l4-8a2 2 0 0 1 2 2v4h6a2 2 0 0 1 2 2.3l-1 6A2 2 0 0 1 18 19H7" /></svg> }
function WarnIcon() { return <svg {...iconProps}><path d="M12 3 2 20h20zM12 10v4M12 17h.01" /></svg> }

export default async function PublishedMacroPage({ params }: PageProps<'/macros/[slug]'>) {
  const { slug } = await params
  // 停止中のマクロは、管理者にだけ見せる（再公開のため）。操作の許可そのものはサーバーアクション側で判定する。
  const admin = (await auth())?.user.isAdmin === true
  const macro = await (admin ? findMacroIncludingSuspended(slug) : findPublishedMacro(slug))
  if (!macro) notFound()
  const [related, origin] = await Promise.all([findRelatedMacros(slug), macro.arrangedFrom ? findPublishedMacro(macro.arrangedFrom) : undefined])

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <Link href="/macros" className={styles.backLink}>← 公開マクロ一覧に戻る</Link>
        {macro.status === 'suspended' && <p role="status" className={styles.suspendedNotice}>このマクロは公開停止中です。管理者にだけ表示されています。</p>}
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
          <div className={styles.actions}>
            <CopyMacroButton text={macro.body} />
            <Link href={buildEditorPath({ version: 1, body: macro.body }, macro.slug)} className={styles.openLink}>エディタで編集</Link>
          </div>
          <section className={styles.reactions}>
            <PublishedMacroReactions macroSlug={macro.slug} initialHelpful={macro.reactions.helpful} initialProblem={macro.reactions.problem} />
          </section>
          {admin && <AdminMacroControls slug={macro.slug} status={macro.status} />}
          <footer className={styles.meta}>
            投稿者 {macro.authorHandle} · {macro.publishedAt}
            {origin && <> · アレンジ元：<Link href={`/macros/${origin.slug}`} className={styles.originLink}>{origin.title}</Link></>}
          </footer>
        </article>
        {related.length > 0 && (
          <section className={styles.related} aria-labelledby="related-heading">
            <h2 id="related-heading" className={styles.relatedHeading}>似たマクロ</h2>
            <div className={styles.relatedList}>
              {related.map((item) => (
                <Link key={item.slug} href={`/macros/${item.slug}`} className={styles.relatedCard}>
                  <span className={styles.relatedTags}>{item.tags.map((tag) => `#${tag}`).join(' ')}</span>
                  <span className={styles.relatedTitle}>{item.title}</span>
                  <span className={styles.relatedDescription}>{item.description}</span>
                  <span className={styles.relatedReactions}>
                    <span className={styles.helpfulCount} title="役に立った"><ThumbIcon />{item.reactions.helpful}<span className={styles.srOnly}>件が役に立った</span></span>
                    <span className={styles.problemCount} title="不具合あり"><WarnIcon />{item.reactions.problem}<span className={styles.srOnly}>件が不具合あり</span></span>
                  </span>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  )
}
