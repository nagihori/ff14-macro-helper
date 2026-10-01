'use client'

import { useState } from 'react'
import { getDictionary } from '@/lib/commands/dictionary'
import { analyze } from '@/lib/macro/analyze'
import type { Diagnostic } from '@/lib/macro/types'
import { setCheckedBody } from '@/lib/share/editor-draft'
import { MacroCheckDialog } from './MacroCheckDialog'

type Pending = { issues: Diagnostic[]; actionLabel: string; proceed: () => void }

// コピー・共有・公開の前に本文を解析し、エラー／警告があれば確認ダイアログを挟む。
// 問題がなければそのまま proceed する。問題を黙って見逃さない（AGENTS.md の禁止事項）。
export function useMacroCheck() {
  const [pending, setPending] = useState<Pending | null>(null)

  function guard(body: string, actionLabel: string, proceed: () => void) {
    const issues = analyze(body, getDictionary(), { complete: true }).diagnostics.filter((diagnostic) => diagnostic.severity !== 'info')
    if (issues.length === 0) return proceed()
    setCheckedBody(body) // 「修正する」でエディタに戻った時も波線が残るよう、エディタへ伝える
    setPending({ issues, actionLabel, proceed })
  }

  const dialog = pending && (
    <MacroCheckDialog issues={pending.issues} actionLabel={pending.actionLabel} onProceed={pending.proceed} onClose={() => setPending(null)} />
  )
  return { guard, dialog }
}
