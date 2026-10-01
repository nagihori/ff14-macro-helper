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

  // 取り消し：Cookie を即時失効させ、投票前の状態（ボタン表示）へ戻す。
  function cancel() {
    document.cookie = `ff14-macro-reaction-${macroSlug}=; path=/; max-age=0; samesite=lax`
    setSelected(null)
  }

  if (selected) {
    const helpful = initialHelpful + (selected === 'helpful' ? 1 : 0)
    const problem = initialProblem + (selected === 'problem' ? 1 : 0)
    const cancelButton = <button type="button" onClick={cancel} title="投票を取り消す" aria-label="投票を取り消す" className={styles.cancel}>×</button>
    return (
      <p className={styles.recorded} aria-label="このマクロへの投票結果">
        <span className={`${styles.count} ${styles.helpfulText} ${selected === 'helpful' ? styles.mine : ''}`}>役に立った {helpful}</span>
        {selected === 'helpful' && cancelButton}
        <span className={`${styles.count} ${styles.problemText} ${selected === 'problem' ? styles.mine : ''}`}>不具合あり {problem}</span>
        {selected === 'problem' && cancelButton}
      </p>
    )
  }

  return (
    <div className={styles.buttons} aria-label="このマクロへのリアクション">
      <button type="button" onClick={() => choose('helpful')} className={`${styles.button} ${styles.helpful}`}>役に立った {initialHelpful}</button>
      <button type="button" onClick={() => choose('problem')} className={`${styles.button} ${styles.problem}`}>不具合あり {initialProblem}</button>
    </div>
  )
}
