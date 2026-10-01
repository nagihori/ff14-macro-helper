'use client'

import { useState } from 'react'
import styles from './CopyMacroButton.module.scss'

// マクロ本文をクリップボードへコピーする主操作ボタン。
export function CopyMacroButton({ text }: { text: string }) {
  const [state, setState] = useState<'idle' | 'copied' | 'failed'>('idle')

  async function copy() {
    try {
      await navigator.clipboard.writeText(text)
      setState('copied')
    } catch {
      setState('failed')
    }
    setTimeout(() => setState('idle'), 2000)
  }

  return (
    <button type="button" onClick={copy} className={styles.button} aria-live="polite">
      {state === 'copied' ? 'コピーしました' : state === 'failed' ? 'コピーできませんでした' : 'マクロテキストをコピー'}
    </button>
  )
}
