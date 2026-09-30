'use client'

import Link from 'next/link'
import { useState } from 'react'
import { samplePublishedMacros } from '@/lib/published-macros/sample-data'

const tagSuggestions = [...new Set(samplePublishedMacros.flatMap((macro) => macro.tags))]

// URL・タイトル・タグだけを受け取る最小フォーム。DB 導入時は送信処理を API に置換する。
export function PublishFromUrlForm() {
  const [submitted, setSubmitted] = useState(false)
  const [tags, setTags] = useState('')

  // 候補タグを末尾へ足す。将来はこの候補群を投稿データではなくタグ辞書から取得する。
  function addTag(tag: string) {
    const existing = tags.split(',').map((value) => value.trim()).filter(Boolean)
    if (!existing.includes(tag)) setTags([...existing, tag].join(', '))
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitted(true)
  }

  return <main className="mx-auto w-full max-w-2xl px-6 py-12 sm:px-10"><Link href="/macros" className="text-sm text-zinc-600 hover:underline dark:text-zinc-300">← 公開マクロ一覧に戻る</Link><h1 className="mt-8 text-3xl font-semibold tracking-tight">共有 URL から公開する</h1><p className="mt-3 leading-7 text-zinc-600 dark:text-zinc-300"><Link href="/" className="font-medium underline underline-offset-4">エディタ</Link>で作ったマクロを共有できます。見つけやすいタイトルとタグを心がけてください。</p><form onSubmit={handleSubmit} className="mt-8 space-y-6 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"><label className="block text-sm font-semibold">共有 URL<input required type="url" placeholder="https://…" className="mt-2 w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 font-normal outline-none focus:border-zinc-700 dark:border-zinc-700 dark:bg-zinc-950" /></label><label className="block text-sm font-semibold">タイトル<input required maxLength={60} placeholder="例：コンテンツ開始前の確認" className="mt-2 w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 font-normal outline-none focus:border-zinc-700 dark:border-zinc-700 dark:bg-zinc-950" /></label><label className="block text-sm font-semibold">タグ<input value={tags} onChange={(event) => setTags(event.target.value)} placeholder="例：パーティ, チャット" className="mt-2 w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 font-normal outline-none focus:border-zinc-700 dark:border-zinc-700 dark:bg-zinc-950" /></label><div><p className="text-sm font-semibold">候補</p><div className="mt-2 flex flex-wrap gap-2">{tagSuggestions.map((tag) => <button key={tag} type="button" onClick={() => addTag(tag)} className="text-sm text-amber-800 underline decoration-amber-400 underline-offset-4 hover:text-amber-600 dark:text-amber-200">#{tag}</button>)}</div></div><button type="submit" className="rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-bold text-white dark:bg-white dark:text-zinc-900">公開内容を確認する</button>{submitted && <p role="status" className="rounded-xl bg-amber-50 p-4 text-sm leading-6 text-amber-950 dark:bg-amber-300/10 dark:text-amber-100">これは UI 試作です。次の実装で URL の検証、NG ワード確認、公開停止状態、Discord / X OAuth の投稿者識別をこの送信地点に追加します。</p>}</form></main>
}
