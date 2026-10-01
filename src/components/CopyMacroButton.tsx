'use client'

import { UI_TEXT } from '@/lib/ui-text'
import { ActionButton } from './ActionButton'
import { CopyIcon } from './icons'
import { useCopyFeedback } from './useCopyFeedback'

// マクロ本文をクリップボードへコピーする主操作ボタン。
export function CopyMacroButton({ text }: { text: string }) {
  const { state, run } = useCopyFeedback()
  return (
    <ActionButton icon={<CopyIcon />} feedback={state} onClick={() => run(() => navigator.clipboard.writeText(text))}>
      {UI_TEXT.copyMacro}
    </ActionButton>
  )
}
