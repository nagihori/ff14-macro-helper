'use client'

import { useState } from 'react'
import { deleteSuspendedMacroAsAdmin } from '@/app/macros/[slug]/actions'
import styles from './AdminMacroControls.module.scss'

// 公開停止中のマクロを消す管理者向けの操作。取り消せないので、押したあとにもう一段、確認を挟む。実行可否はサーバーアクション側で再判定する。
export function AdminDeleteControl({ slug }: { slug: string }) {
  const [confirming, setConfirming] = useState(false)
  if (!confirming) return <button type="button" onClick={() => setConfirming(true)} className={styles.button}>削除…</button>
  return (
    <form action={deleteSuspendedMacroAsAdmin.bind(null, slug)} className={styles.row}>
      <p className={styles.status}>本文を含めて消え、元に戻せません。</p>
      <button type="submit" className={styles.button}>削除する</button>
      <button type="button" onClick={() => setConfirming(false)} className={styles.button}>やめる</button>
    </form>
  )
}
