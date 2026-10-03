'use client'

import { BAR_TEXT, UI_TEXT } from '@/lib/ui-text'
import { ActionBar, ActionBarItem } from './ActionBar'
import { CopyIcon, EditIcon } from './icons'
import { useCopyFeedback } from './useCopyFeedback'

// 記事に埋め込んだマクロの操作帯（copy / edit）。詳細ページのコードブロックの操作帯（MacroCodeBar）と同じ見た目。
// 記事を読んだ人が、マクロをすぐゲームに持って行けるように、コピーを目立つ位置に置く。
export function ArticleMacroBar({ body, editHref }: { body: string; editHref: string }) {
  const copy = useCopyFeedback()
  return (
    <ActionBar label="マクロ本文の操作">
      <ActionBarItem icon={<CopyIcon />} caption={BAR_TEXT.copy} title={UI_TEXT.copyMacro} feedback={copy.state} onClick={() => copy.run(() => navigator.clipboard.writeText(body))} />
      <ActionBarItem icon={<EditIcon />} caption={BAR_TEXT.edit} title={UI_TEXT.editInEditor} href={editHref} />
    </ActionBar>
  )
}
