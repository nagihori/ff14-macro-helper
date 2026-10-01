'use client'

import { useEffect, useState } from 'react'
import styles from './PublishedMacroReactions.module.scss'

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
    return <p className={styles.recorded}><span className={styles.recordedLabel}>{label} {count}</span> を記録しました</p>
  }

  return (
    <div className={styles.buttons} aria-label="このマクロへのリアクション">
      <button type="button" onClick={() => choose('helpful')} className={`${styles.button} ${styles.helpful}`}>役に立った {initialHelpful}</button>
      <button type="button" onClick={() => choose('problem')} className={`${styles.button} ${styles.problem}`}>不具合あり {initialProblem}</button>
    </div>
  )
}
