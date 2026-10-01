'use client'

import { UI_TEXT } from '@/lib/ui-text'
import { ActionButton } from './ActionButton'
import { ShareIcon } from './icons'
import { useShareUrl } from './useShareUrl'

// 詳細ページの共有ボタン。PC では「URLをコピー」、共有シートが使える端末では「共有」（useShareUrl 参照）。
export function ShareMacroButton({ title, path }: { title: string; path: string }) {
  const { state, share, usesShareSheet } = useShareUrl(title, path)
  return (
    <ActionButton icon={<ShareIcon />} variant="secondary" feedback={state} onClick={share}>
      {usesShareSheet ? UI_TEXT.share : UI_TEXT.copyPageUrl}
    </ActionButton>
  )
}
