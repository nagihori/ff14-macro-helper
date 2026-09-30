'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { samplePublishedMacros } from '@/lib/published-macros/sample-data'
import { PublishedMacroReactions } from './PublishedMacroReactions'

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
    <main className="mx-auto w-full max-w-6xl px-6 py-12 sm:px-10">
      <section className="rounded-3xl bg-zinc-950 px-7 py-10 text-white shadow-xl sm:px-10">
        <p className="text-sm font-semibold tracking-[0.18em] text-amber-300">MACRO LIBRARY</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">公開マクロを探す</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-300">実用的なマクロを見つけ、エディタで自分用に調整できます。</p>
        <Link href="/macros/submit" className="mt-6 inline-flex rounded-full border border-zinc-500 px-5 py-2.5 text-sm font-bold text-white transition hover:border-zinc-300 hover:bg-zinc-900">公開する</Link>
      </section>

      <section className="mt-10" aria-label="マクロを絞り込む">
        <label htmlFor="macro-search" className="block text-sm font-semibold">キーワードで探す</label>
        <div className="relative mt-2">
          <input id="macro-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="例：パーティ、採集、#チャット" className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 pr-12 text-sm shadow-sm outline-none focus:border-zinc-700 dark:border-zinc-700 dark:bg-zinc-900" />
          {query && <button type="button" onClick={() => setQuery('')} aria-label="検索をクリア" className="absolute inset-y-0 right-2 my-auto h-8 w-8 rounded-full text-lg text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800">×</button>}
        </div>
        <div className="mt-4 flex flex-wrap gap-3" aria-label="タグから検索">
          {tags.map((tag) => <button key={tag} type="button" onClick={() => setQuery(`#${tag}`)} className="text-sm font-medium text-amber-800 underline decoration-amber-400 underline-offset-4 hover:text-amber-600 dark:text-amber-200">#{tag}</button>)}
        </div>
      </section>

      <p className="mt-8 text-sm text-zinc-500">{macros.length} 件の公開マクロ</p>
      <section className="mt-3 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {macros.map((macro) => <article key={macro.slug} className="flex min-h-72 flex-col rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex flex-wrap gap-2">{macro.tags.map((tag) => <button key={tag} type="button" onClick={() => setQuery(`#${tag}`)} className="text-xs font-semibold text-amber-800 underline decoration-amber-400 underline-offset-4 hover:text-amber-600 dark:text-amber-200">#{tag}</button>)}</div>
          <h2 className="mt-4 text-lg font-semibold"><Link href={`/macros/${macro.slug}`} className="hover:underline">{macro.title}</Link></h2>
          <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-300">{macro.description}</p>
          <p className="mt-4 text-xs text-zinc-500">投稿者 {macro.authorHandle} · {macro.publishedAt}</p>
          <div className="mt-auto pt-5"><PublishedMacroReactions macroSlug={macro.slug} initialHelpful={macro.reactions.helpful} initialProblem={macro.reactions.problem} /></div>
        </article>)}
      </section>
      {macros.length === 0 && <p className="mt-3 rounded-2xl border border-dashed border-zinc-300 py-10 text-center text-sm text-zinc-500">条件に一致するマクロはありません。検索語やタグを変えてください。</p>}
    </main>
  )
}
