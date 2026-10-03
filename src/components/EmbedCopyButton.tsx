'use client'

import { UI_TEXT } from '@/lib/ui-text'
import { ActionButton } from './ActionButton'
import { CopyIcon } from './icons'
import { useCopyFeedback } from './useCopyFeedback'

// 別オリジンの iframe の中では、貼り付け側が allow="clipboard-write" を付けていないと navigator.clipboard が拒まれる。
// そのため、拒まれたら textarea を使う従来の方法（execCommand）に切り替える。
async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    const area = document.createElement('textarea')
    area.value = text
    area.setAttribute('readonly', '')
    area.style.position = 'fixed'
    area.style.opacity = '0'
    document.body.appendChild(area)
    area.select()
    const ok = document.execCommand('copy')
    area.remove()
    return ok
  }
}

// 埋め込み表示のヘッダーにある「マクロテキストをコピー」。
export function EmbedCopyButton({ text, className }: { text: string; className?: string }) {
  const { state, run } = useCopyFeedback()
  return (
    <ActionButton icon={<CopyIcon />} variant="secondary" feedback={state} className={className} onClick={() => run(() => copyText(text))}>
      {UI_TEXT.copyMacro}
    </ActionButton>
  )
}
