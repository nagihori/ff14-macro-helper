'use client'

import { useEffect, useState, useTransition } from 'react'
import { setReaction, type ReactionCounts, type ReactionKind } from '@/app/macros/reactions'
import { ThumbIcon, WarningIcon } from './icons'
import styles from './PublishedMacroReactions.module.scss'

// 自分の選択は Cookie（サーバーアクションが書く）から読み取り、同じブラウザでの重複リアクションを UI 上も防ぐ。
function readReaction(slug: string): ReactionKind | null {
  const value = document.cookie.split('; ').find((item) => item.startsWith(`ff14-macro-reaction-${slug}=`))?.split('=')[1]
  return value === 'helpful' || value === 'problem' ? value : null
}

export function PublishedMacroReactions({ macroSlug, initialHelpful, initialProblem }: { macroSlug: string; initialHelpful: number; initialProblem: number }) {
  const [selected, setSelected] = useState<ReactionKind | null>(null)
  // 件数はサーバー集計（自分の 1 票を含む）。押した直後は先に表示を動かし、サーバーの返答で確定する。
  const [counts, setCounts] = useState<ReactionCounts>({ helpful: initialHelpful, problem: initialProblem })
  const [, startTransition] = useTransition()
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Cookie の外部状態をマウント後に同期する。
    setSelected(readReaction(macroSlug))
  }, [macroSlug])

  function vote(next: ReactionKind | null) {
    const previous = { selected, counts }
    const bump = (kind: ReactionKind, by: number) => ({ ...counts, [kind]: Math.max(0, counts[kind] + by) })
    setCounts(next ? bump(next, 1) : bump(selected!, -1))
    setSelected(next)
    startTransition(async () => {
      const result = await setReaction(macroSlug, next)
      if (result) setCounts(result)
      else { setCounts(previous.counts); setSelected(previous.selected) } // 停止された・存在しないなど
    })
  }

  function choose(kind: ReactionKind) {
    if (selected) return
    vote(kind)
  }

  // 取り消し：投票前の状態（ボタン表示）へ戻す。
  function cancel() {
    if (selected) vote(null)
  }

  if (selected) {
    const { helpful, problem } = counts
    const cancelButton = <button type="button" onClick={cancel} title="投票を取り消す" aria-label="投票を取り消す" className={styles.cancel}>×</button>
    return (
      <p className={styles.recorded} aria-label="このマクロへの投票結果">
        <span className={`${styles.count} ${styles.helpfulText} ${selected === 'helpful' ? styles.mine : ''}`}><ThumbIcon />役に立った {helpful}</span>
        {selected === 'helpful' && cancelButton}
        <span className={`${styles.count} ${styles.problemText} ${selected === 'problem' ? styles.mine : ''}`}><WarningIcon />不具合あり {problem}</span>
        {selected === 'problem' && cancelButton}
      </p>
    )
  }

  return (
    <div className={styles.buttons} aria-label="このマクロへのリアクション">
      <button type="button" onClick={() => choose('helpful')} className={`${styles.button} ${styles.helpful}`}><ThumbIcon />役に立った {counts.helpful}</button>
      <button type="button" onClick={() => choose('problem')} className={`${styles.button} ${styles.problem}`}><WarningIcon />不具合あり {counts.problem}</button>
    </div>
  )
}
