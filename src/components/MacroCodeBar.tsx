'use client'

import { BAR_TEXT, UI_TEXT } from '@/lib/ui-text'
import { ActionBar, ActionBarItem } from './ActionBar'
import { CopyIcon, EditIcon, ShareIcon } from './icons'
import { useCopyFeedback } from './useCopyFeedback'
import { useShareUrl } from './useShareUrl'

// 詳細ページのコードブロック上部の操作帯（copy / edit / share）。下のアクションボタン群と同じ操作を別の場所から呼ぶ。
// 停止中のマクロでは共有（canShare = false）を出さない。
export function MacroCodeBar({ body, editHref, title, path, canShare }: { body: string; editHref: string; title: string; path: string; canShare: boolean }) {
  const copy = useCopyFeedback()
  const { state, share, usesShareSheet } = useShareUrl(title, path)
  return (
    <ActionBar label="マクロ本文の操作">
      <ActionBarItem icon={<CopyIcon />} caption={BAR_TEXT.copy} title={UI_TEXT.copyMacro} feedback={copy.state} onClick={() => copy.run(() => navigator.clipboard.writeText(body))} />
      <ActionBarItem icon={<EditIcon />} caption={BAR_TEXT.edit} title={UI_TEXT.editInEditor} href={editHref} />
      {canShare && <ActionBarItem icon={<ShareIcon />} caption={BAR_TEXT.share} title={usesShareSheet ? UI_TEXT.share : UI_TEXT.copyPageUrl} feedback={state} onClick={share} />}
    </ActionBar>
  )
}
