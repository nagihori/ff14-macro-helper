'use client'

import { UI_TEXT } from '@/lib/ui-text'
import { ActionButton } from './ActionButton'
import { CopyIcon } from './icons'
import { useCopyFeedback } from './useCopyFeedback'

// Lodestone の掲示板に貼る BB コード（構文ハイライト付き）をコピーする。
// 本体は主役にしないので ghost。BB コードはサーバー側で作って渡す（lib/share/lodestone.ts）。
export function CopyLodestoneButton({ bbcode }: { bbcode: string }) {
  const { state, run } = useCopyFeedback()
  return (
    <ActionButton icon={<CopyIcon />} variant="ghost" feedback={state} onClick={() => run(() => navigator.clipboard.writeText(bbcode))}>
      {UI_TEXT.copyLodestone}
    </ActionButton>
  )
}
