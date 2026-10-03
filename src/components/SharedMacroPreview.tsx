'use client'

import { useEffect, useState } from 'react'
import { previewSharedMacro } from '@/app/macros/submit/actions'
import { decodeDocument, readShareParam } from '@/lib/share/url'
import { MacroCodeView } from './MacroCodeView'
import styles from './PublishFromUrlForm.module.scss'

// 貼られた共有 URL の本文を、フォームの中に見せる（エディタに切り替えて見比べなくてよいように）。
// 長い共有 URL（?m=…）はここで読める。短縮 URL（/s/{id}）は、サーバーの表示用アクションで本文を引く。
// 読めないときは何も出さない（エラーは、投稿のときのサーバー側の検証が出す）。
const SHORT_PATH = /^\/s\/[a-km-z2-9]{8}\/?$/

function readLongBody(value: string): string | null {
  try {
    const decoded = decodeDocument(readShareParam(new URL(value.trim()).search) ?? '')
    return decoded.ok ? decoded.document.body : null
  } catch {
    return null
  }
}

function isShortUrl(value: string): boolean {
  try { return SHORT_PATH.test(new URL(value.trim()).pathname) } catch { return false }
}

export function SharedMacroPreview({ shareUrl }: { shareUrl: string }) {
  // 短縮 URL の本文は、URL ごとに 1 回だけ引く（URL を直したら、また引く）。
  const [fetched, setFetched] = useState<{ url: string; body: string | null } | null>(null)
  const long = readLongBody(shareUrl)
  const short = long === null && isShortUrl(shareUrl)

  useEffect(() => {
    if (!short) return
    let cancelled = false
    const timer = window.setTimeout(() => {
      previewSharedMacro(shareUrl).then((body) => { if (!cancelled) setFetched({ url: shareUrl, body }) }).catch(() => { if (!cancelled) setFetched({ url: shareUrl, body: null }) })
    }, 400)
    return () => { cancelled = true; window.clearTimeout(timer) }
  }, [short, shareUrl])

  const body = long ?? (short && fetched?.url === shareUrl ? fetched.body : null)
  if (!body) return null
  return (
    <details open className={styles.accordion}>
      <summary className={styles.accordionSummary}>投稿されるマクロ（{body.split('\n').length} 行）</summary>
      <div className={styles.macroPreview}><MacroCodeView body={body} /></div>
    </details>
  )
}
