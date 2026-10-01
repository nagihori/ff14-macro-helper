'use client'

import { useState } from 'react'
import styles from './ShareMacroButton.module.scss'

const iconProps = { width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true } as const

// 詳細ページの共有ボタン（アイコンのみ）。タッチ操作の端末（スマホ・タブレット）で共有に対応していれば OS の共有シートを開く。
// それ以外（PC など）は、シートを開かずこのページの URL をコピーする（PC の共有シートは出口が少なく、コピーしたいだけの人には遠回りなので）。
// 共有されるのは詳細ページの URL で、クエリは含めない。
export function ShareMacroButton({ title, path }: { title: string; path: string }) {
  const [copied, setCopied] = useState<'idle' | 'copied' | 'failed'>('idle')

  async function share() {
    const url = new URL(path, window.location.origin).toString()
    if (typeof navigator.share === 'function' && window.matchMedia('(pointer: coarse)').matches) {
      try {
        await navigator.share({ title, url })
      } catch {
        // 共有シートを閉じただけ（AbortError）などは何もしない
      }
      return
    }
    try {
      await navigator.clipboard.writeText(url)
      setCopied('copied')
    } catch {
      setCopied('failed')
    }
    setTimeout(() => setCopied('idle'), 2000)
  }

  return (
    <button type="button" onClick={share} className={styles.button} aria-label="このマクロを共有" title="リンクを共有・コピー">
      {copied === 'copied' ? (
        <svg {...iconProps}><path d="M5 12.5 10 17.5 19 7" /></svg>
      ) : (
        <svg {...iconProps}><path d="M12 3v12M8 7l4-4 4 4M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7" /></svg>
      )}
      <span role="status" className={styles.status}>{copied === 'copied' ? 'リンクをコピーしました' : copied === 'failed' ? 'コピーできませんでした' : ''}</span>
    </button>
  )
}
