'use client'

import Link from 'next/link'
import { useState } from 'react'
import { deleteMyMacro } from '@/app/macros/[slug]/owner-actions'
import styles from './AdminMacroControls.module.scss'

// 詳細ページの投稿者向け操作欄（編集・削除）。表示は本人の場合だけだが、実行可否はサーバーアクション側で再判定する。
// 削除は取り消せないので、押したあとにもう一段、確認を挟む。
export function OwnerMacroControls({ slug, canEdit }: { slug: string; canEdit: boolean }) {
  const [confirming, setConfirming] = useState(false)
  return (
    <section className={styles.box} aria-label="投稿者の操作">
      <p className={styles.label}>あなたの投稿</p>
      <div className={styles.row}>
        {canEdit && <Link href={`/macros/${slug}/edit`} className={styles.button}>タイトル・説明・タグを編集</Link>}
        {confirming ? (
          <form action={deleteMyMacro.bind(null, slug)} className={styles.row}>
            <p className={styles.status}>本文を含めて消え、元に戻せません。派生マクロには「削除済み」とタイトルだけ残ります。</p>
            <button type="submit" className={styles.button}>削除する</button>
            <button type="button" onClick={() => setConfirming(false)} className={styles.button}>やめる</button>
          </form>
        ) : (
          <button type="button" onClick={() => setConfirming(true)} className={styles.button}>削除…</button>
        )}
      </div>
    </section>
  )
}
