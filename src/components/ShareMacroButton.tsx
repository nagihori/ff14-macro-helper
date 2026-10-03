'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { UI_TEXT } from '@/lib/ui-text'
import { ActionButton } from './ActionButton'
import { ChevronDownIcon, CopyIcon, ShareIcon } from './icons'
import { useCopyFeedback } from './useCopyFeedback'
import { useShareUrl } from './useShareUrl'
import styles from './ShareMacroButton.module.scss'

// 詳細ページの共有ボタン。本体は「URLをコピー」（共有シートが使える端末では「URLを共有」。useShareUrl 参照）で、
// 右端の ▼ を押すとほかの共有方法（いまは Lodestone 用の BB コード）が開く。共有方法が増えても本体のボタンは増やさない。
// BB コードはサーバー側で作って渡す（lib/share/lodestone.ts）。
export function ShareMacroButton({ title, path, lodestoneBBCode }: { title: string; path: string; lodestoneBBCode?: string }) {
  const { state, share, usesShareSheet } = useShareUrl(title, path)
  const { state: lodestoneState, run } = useCopyFeedback()
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const toggleRef = useRef<HTMLButtonElement>(null)
  const panelId = useId()

  // 開いている間だけ、外側のクリックと Esc で閉じる（Esc ではフォーカスを ▼ に戻す）。
  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      setOpen(false)
      toggleRef.current?.focus()
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  const main = (
    <ActionButton icon={<ShareIcon />} variant="secondary" feedback={state} onClick={share} className={lodestoneBBCode ? styles.main : undefined}>
      {usesShareSheet ? UI_TEXT.share : UI_TEXT.copyPageUrl}
    </ActionButton>
  )
  if (!lodestoneBBCode) return main

  return (
    <div ref={rootRef} className={styles.split}>
      {main}
      <button
        ref={toggleRef}
        type="button"
        className={styles.toggle}
        aria-label={UI_TEXT.moreShare}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((value) => !value)}
      >
        <ChevronDownIcon />
      </button>
      {open && (
        <div id={panelId} className={styles.panel}>
          <ActionButton
            icon={<CopyIcon />}
            variant="ghost"
            feedback={lodestoneState}
            onClick={() => run(() => navigator.clipboard.writeText(lodestoneBBCode))}
          >
            {UI_TEXT.copyLodestone}
          </ActionButton>
        </div>
      )}
    </div>
  )
}
