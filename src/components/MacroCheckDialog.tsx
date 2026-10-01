'use client'

import { useEffect, useRef } from 'react'
import type { Diagnostic } from '@/lib/macro/types'
import styles from './MacroCheckDialog.module.scss'

const SEVERITY_LABEL = { error: 'エラー', warning: '警告', info: '情報' } as const

// コピー・共有・公開の直前に、解析で見つかった問題を見せる確認ダイアログ。
// 色だけに頼らず、重大度を文字で、場所を行番号で示す。
export function MacroCheckDialog({ issues, actionLabel, onProceed, onClose }: { issues: Diagnostic[]; actionLabel: string; onProceed: () => void; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => { ref.current?.showModal() }, [])

  return (
    <dialog ref={ref} onClose={onClose} className={styles.dialog} aria-labelledby="macro-check-title">
      <h2 id="macro-check-title" className={styles.title}>マクロに {issues.length} 件の問題があります</h2>
      <p className={styles.lead}>このままだと、ゲーム内で貼り付けた時に意図どおり動かない可能性があります。</p>
      <ul className={styles.list}>
        {issues.map((issue, index) => (
          <li key={index} className={styles.item}>
            <span className={`${styles.badge} ${issue.severity === 'error' ? styles.error : styles.warning}`}>{SEVERITY_LABEL[issue.severity]}</span>
            <span className={styles.line}>L{issue.line}</span>
            <span>{issue.message}</span>
          </li>
        ))}
      </ul>
      <div className={styles.actions}>
        <button type="button" onClick={() => ref.current?.close()} className={styles.primary}>エディタで修正する</button>
        <button type="button" onClick={() => { ref.current?.close(); onProceed() }} className={styles.secondary}>このまま{actionLabel}</button>
      </div>
    </dialog>
  )
}
