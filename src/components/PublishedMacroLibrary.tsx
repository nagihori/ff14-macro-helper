'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { samplePublishedMacros } from '@/lib/published-macros/sample-data'
import { PublishedMacroReactions } from './PublishedMacroReactions'
import styles from './PublishedMacroLibrary.module.scss'

// タグも通常の検索語と同じ検索欄で扱えるように、表示用の # を付けて検索対象へ加える。
function matchesSearch(query: string, values: string[]): boolean {
  const normalized = query.trim().toLocaleLowerCase('ja-JP')
  return normalized.length === 0 || values.join(' ').toLocaleLowerCase('ja-JP').includes(normalized)
}

export function PublishedMacroLibrary({ initialQuery = '' }: { initialQuery?: string }) {
  const [query, setQuery] = useState(initialQuery)
  const tags = [...new Set(samplePublishedMacros.flatMap((macro) => macro.tags))]
  const macros = useMemo(
    () => samplePublishedMacros.filter((macro) => matchesSearch(query, [macro.title, macro.description, ...macro.tags.map((tag) => `#${tag}`)])),
    [query],
  )

  return (
    <main className={styles.library}>
      <section className={styles.hero}>
        <p className={styles.eyebrow}>MACRO LIBRARY</p>
        <h1 className={styles.heroTitle}>公開マクロを探す</h1>
        <p className={styles.heroLead}>実用的なマクロを見つけ、エディタで自分用に調整できます。</p>
        <Link href="/macros/submit" className={styles.heroAction}>公開する</Link>
      </section>

      <section className={styles.search} aria-label="マクロを絞り込む">
        <label htmlFor="macro-search" className={styles.searchLabel}>キーワードで探す</label>
        <div className={styles.searchField}>
          <input id="macro-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="例：パーティ、採集、#チャット" className={styles.searchInput} />
          {query && <button type="button" onClick={() => setQuery('')} aria-label="検索をクリア" className={styles.clearButton}>×</button>}
        </div>
        <div className={styles.tagCloud} aria-label="タグから検索">
          {tags.map((tag) => <button key={tag} type="button" onClick={() => setQuery(`#${tag}`)} className={styles.tagCloudItem}>#{tag}</button>)}
        </div>
      </section>

      <p className={styles.count}>{macros.length} 件の公開マクロ</p>
      <section className={styles.grid}>
        {macros.map((macro) => <article key={macro.slug} className={styles.card}>
          <div className={styles.cardTags}>{macro.tags.map((tag) => <button key={tag} type="button" onClick={() => setQuery(`#${tag}`)} className={styles.cardTag}>#{tag}</button>)}</div>
          <h2 className={styles.cardTitle}><Link href={`/macros/${macro.slug}`} className={styles.cardTitleLink}>{macro.title}</Link></h2>
          <p className={styles.cardDescription}>{macro.description}</p>
          <p className={styles.cardMeta}>投稿者 {macro.authorHandle} · {macro.publishedAt}</p>
          <div className={styles.cardReactions}><PublishedMacroReactions macroSlug={macro.slug} initialHelpful={macro.reactions.helpful} initialProblem={macro.reactions.problem} /></div>
        </article>)}
      </section>
      {macros.length === 0 && <p className={styles.empty}>条件に一致するマクロはありません。検索語やタグを変えてください。</p>}
    </main>
  )
}
