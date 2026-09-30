'use client'

import { useEffect, useState } from 'react'

type ReactionKind = 'helpful' | 'problem'

// Cookie の選択を読み取り、同じブラウザでの重複リアクションを UI 上も防ぐ。
function readReaction(slug: string): ReactionKind | null {
  const value = document.cookie.split('; ').find((item) => item.startsWith(`ff14-macro-reaction-${slug}=`))?.split('=')[1]
  return value === 'helpful' || value === 'problem' ? value : null
}

export function PublishedMacroReactions({ macroSlug, initialHelpful, initialProblem }: { macroSlug: string; initialHelpful: number; initialProblem: number }) {
  const [selected, setSelected] = useState<ReactionKind | null>(null)
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Cookie の外部状態をマウント後に同期する。
    setSelected(readReaction(macroSlug))
  }, [macroSlug])

  function choose(kind: ReactionKind) {
    if (selected) return
    document.cookie = `ff14-macro-reaction-${macroSlug}=${kind}; path=/; max-age=31536000; samesite=lax`
    setSelected(kind)
  }

  if (selected) {
    const label = selected === 'helpful' ? '役に立った' : '不具合あり'
    const count = selected === 'helpful' ? initialHelpful + 1 : initialProblem + 1
    return <p className="text-sm text-zinc-500"><span className="font-medium text-zinc-800 dark:text-zinc-200">{label} {count}</span> を記録しました</p>
  }

  return <div className="flex flex-wrap items-center gap-2" aria-label="このマクロへのリアクション"><button type="button" onClick={() => choose('helpful')} className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200">役に立った {initialHelpful}</button><button type="button" onClick={() => choose('problem')} className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1.5 text-sm font-medium text-rose-800 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200">不具合あり {initialProblem}</button></div>
}
