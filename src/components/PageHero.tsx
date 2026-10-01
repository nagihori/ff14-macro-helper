import styles from './PageHero.module.scss'

// ページ冒頭の暗いタイトルボックス（/macros と / で共通）。compact で余白を少し詰める。
export function PageHero({ eyebrow, title, lead, compact }: { eyebrow: string; title: string; lead: string; compact?: boolean }) {
  return (
    <section className={compact ? `${styles.hero} ${styles.compact}` : styles.hero}>
      <p className={styles.eyebrow}>{eyebrow}</p>
      <h1 className={styles.title}>{title}</h1>
      <p className={styles.lead}>{lead}</p>
    </section>
  )
}
