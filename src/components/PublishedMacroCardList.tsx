import Link from 'next/link'
import type { PublishedMacro } from '@/lib/published-macros/types'
import { tagPath } from '@/lib/published-macros/tags'
import { MacroDescription } from './MacroDescription'
import { PublishedMacroReactions } from './PublishedMacroReactions'
import styles from './PublishedMacroCardList.module.scss'

// 公開マクロのカード一覧（/macros と、タグ別一覧 /macros/tag/[tag] で共通）。カードのタグはタグ別一覧へのリンク。
export function PublishedMacroCardList({ macros }: { macros: PublishedMacro[] }) {
  return (
    <section className={styles.grid}>
      {macros.map((macro) => <article key={macro.slug} className={styles.card}>
        <div className={styles.cardTags}>{macro.tags.map((tag) => <Link key={tag} href={tagPath(tag)} className={styles.cardTag}>#{tag}</Link>)}</div>
        <h2 className={styles.cardTitle}><Link href={`/macros/${macro.slug}`} className={styles.cardTitleLink}>{macro.title}</Link></h2>
        <p className={styles.cardDescription}><MacroDescription description={macro.description} parts={macro.descriptionParts} linkClassName={styles.cardDescriptionLink} /></p>
        <p className={styles.cardMeta}>投稿者 {macro.authorHandle} · {macro.publishedAt}</p>
        <div className={styles.cardReactions}><PublishedMacroReactions macroSlug={macro.slug} initialHelpful={macro.reactions.helpful} initialProblem={macro.reactions.problem} /></div>
      </article>)}
    </section>
  )
}
