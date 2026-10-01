'use client'

import { useRouter } from 'next/navigation'
import { useMacroCheck } from './useMacroCheck'
import { getEditorDraft } from '@/lib/share/editor-draft'
import { buildShareUrl } from '@/lib/share/url'
import styles from './PublishButton.module.scss'

// エディタの現在の本文から共有 URL を作り、公開フォームの URL 欄へ入れた状態で遷移する。
// 現在の URL に `from`（アレンジ元）があれば、共有 URL にもそのまま引き継がれる。
export function PublishButton() {
  const router = useRouter()
  const { guard, dialog } = useMacroCheck()

  function publish() {
    const body = getEditorDraft()
    if (!body) return router.push('/macros/submit')
    guard(body, '公開へ進む', () => {
      const shareUrl = buildShareUrl({ version: 1, body }, window.location.href)
      router.push(`/macros/submit?url=${encodeURIComponent(shareUrl)}`)
    })
  }

  return <><button type="button" onClick={publish} className={styles.button}>公開する</button>{dialog}</>
}
