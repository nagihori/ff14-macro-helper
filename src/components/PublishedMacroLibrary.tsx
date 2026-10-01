'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import type { PublishedMacro } from '@/lib/published-macros/types'
import { PublishedMacroReactions } from './PublishedMacroReactions'
import { MacroDescription } from './MacroDescription'
import { PageHero } from './PageHero'
import styles from './PublishedMacroLibrary.module.scss'

// 空白（全角含む）で区切った語をすべて含むものだけを残す（AND 検索）。
// タグも通常の検索語と同じ検索欄で扱えるように、表示用の # を付けて検索対象へ加える。
function splitTerms(query: string): string[] {
  return query.toLocaleLowerCase('ja-JP').split(/[\s\u3000]+/).filter(Boolean)
}

function matchesSearch(query: string, values: string[]): boolean {
  const haystack = values.join(' ').toLocaleLowerCase('ja-JP')
  return splitTerms(query).every((term) => haystack.includes(term))
}

// タグをクリックしたら、いまの検索語へ追加する（すでに入っていれば何もしない）。
function addTag(query: string, tag: string): string {
  const term = `#${tag}`
  if (splitTerms(query).includes(term.toLocaleLowerCase('ja-JP'))) return query
  const base = query.trimEnd()
  return base ? `${base} ${term}` : term
}

export function PublishedMacroLibrary({ allMacros, initialQuery = '' }: { allMacros: PublishedMacro[]; initialQuery?: string }) {
  const [query, setQuery] = useState(initialQuery)
  const tags = [...new Set(allMacros.flatMap((macro) => macro.tags))]
  const macros = useMemo(
    () => allMacros.filter((macro) => matchesSearch(query, [macro.title, macro.description, ...macro.tags.map((tag) => `#${tag}`)])),
    [allMacros, query],
  )

  return (
    <main className={styles.library}>
      <PageHero eyebrow="MACRO LIBRARY" title="公開マクロを探す" lead="実用的なマクロを見つけ、エディタで自分用に調整できます。" />

      <section className={styles.search} aria-label="マクロを絞り込む">
        <label htmlFor="macro-search" className={styles.searchLabel}>キーワードで探す</label>
        <div className={styles.searchField}>
          <input id="macro-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="例：パーティ 開始、採集、#チャット" className={styles.searchInput} />
          {query && <button type="button" onClick={() => setQuery('')} aria-label="検索をクリア" className={styles.clearButton}>×</button>}
        </div>
        <div className={styles.tagCloud} aria-label="タグから検索">
          {tags.map((tag) => <button key={tag} type="button" onClick={() => setQuery((current) => addTag(current, tag))} className={styles.tagCloudItem}>#{tag}</button>)}
        </div>
      </section>

      <p className={styles.count}>{macros.length} 件の公開マクロ</p>
      <section className={styles.grid}>
        {macros.map((macro) => <article key={macro.slug} className={styles.card}>
          <div className={styles.cardTags}>{macro.tags.map((tag) => <button key={tag} type="button" onClick={() => setQuery(`#${tag}`)} className={styles.cardTag}>#{tag}</button>)}</div>
          <h2 className={styles.cardTitle}><Link href={`/macros/${macro.slug}`} className={styles.cardTitleLink}>{macro.title}</Link></h2>
          <p className={styles.cardDescription}><MacroDescription description={macro.description} parts={macro.descriptionParts} linkClassName={styles.cardDescriptionLink} /></p>
          <p className={styles.cardMeta}>投稿者 {macro.authorHandle} · {macro.publishedAt}</p>
          <div className={styles.cardReactions}><PublishedMacroReactions macroSlug={macro.slug} initialHelpful={macro.reactions.helpful} initialProblem={macro.reactions.problem} /></div>
        </article>)}
      </section>
      {macros.length === 0 && <p className={styles.empty}>条件に一致するマクロはありません。検索語やタグを変えてください。</p>}
    </main>
  )
}
