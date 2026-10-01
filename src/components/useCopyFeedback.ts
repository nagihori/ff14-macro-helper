import { useCallback, useEffect, useRef, useState } from 'react'

export type CopyState = 'idle' | 'copied' | 'failed'

const RESET_MS = 2000

// コピー結果（成功／失敗）を一定時間だけ見せて idle に戻す。操作帯・下部ボタン・共有の3系統で共通。
// run には「コピーして、成功なら true／失敗なら false」を返す関数を渡す（例外を投げても失敗扱い）。
export function useCopyFeedback() {
  const [state, setState] = useState<CopyState>('idle')
  const timerRef = useRef<number | undefined>(undefined)

  useEffect(() => () => window.clearTimeout(timerRef.current), [])

  const run = useCallback(async (copy: () => Promise<boolean | void>) => {
    let ok = true
    try {
      ok = (await copy()) !== false
    } catch {
      ok = false
    }
    setState(ok ? 'copied' : 'failed')
    window.clearTimeout(timerRef.current)
    timerRef.current = window.setTimeout(() => setState('idle'), RESET_MS)
  }, [])

  return { state, run }
}
