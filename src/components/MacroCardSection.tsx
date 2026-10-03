import Link from 'next/link'
import { descriptionToPlainText } from '@/lib/published-macros/description-links'
import type { PublishedMacro } from '@/lib/published-macros/types'
import { ThumbIcon, WarningIcon } from './icons'
import styles from './MacroCardSection.module.scss'

// 「似たマクロ」「派生マクロ」共通のカード一覧。
export function MacroCardSection({ id, heading, items }: { id: string; heading: string; items: PublishedMacro[] }) {
  if (items.length === 0) return null
  return (
    <section className={styles.related} aria-labelledby={id}>
      <h2 id={id} className={styles.relatedHeading}>{heading}</h2>
      <div className={styles.relatedList}>
        {items.map((item) => (
          <Link key={item.slug} href={`/macros/${item.slug}`} className={styles.relatedCard}>
            <span className={styles.relatedTags}>{item.tags.map((tag) => `#${tag}`).join(' ')}</span>
            <span className={styles.relatedTitle}>{item.title}</span>
            <span className={styles.relatedDescription}>{descriptionToPlainText(item.descriptionParts ?? [{ type: 'text', text: item.description }])}</span>
            <span className={styles.relatedReactions}>
              <span className={styles.helpfulCount} title="役に立った"><ThumbIcon />{item.reactions.helpful}<span className={styles.srOnly}>件が役に立った</span></span>
              <span className={styles.problemCount} title="不具合あり"><WarningIcon />{item.reactions.problem}<span className={styles.srOnly}>件が不具合あり</span></span>
            </span>
          </Link>
        ))}
      </div>
    </section>
  )
}
