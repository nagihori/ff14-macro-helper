'use client'

import Link from 'next/link'
import { useActionState } from 'react'
import { updateMyMacro, type EditState } from '@/app/macros/[slug]/owner-actions'
import { LIMITS } from '@/lib/published-macros/publish'
import styles from './PublishFromUrlForm.module.scss'

// 公開済みマクロのタイトル・説明・タグの編集フォーム。マクロ本文は直せない（直すなら新しく公開する）。
export function EditMacroForm({ slug, initial }: { slug: string; initial: { title: string; description: string; tags: string[] } }) {
  const [state, formAction, pending] = useActionState(updateMyMacro.bind(null, slug), { errors: [] } satisfies EditState)
  return (
    <main className={styles.formPage}>
      <Link href={`/macros/${slug}`} className={styles.backLink}>← マクロに戻る</Link>
      <h1 className={styles.title}>タイトル・説明・タグを編集</h1>
      <p className={styles.lead}>マクロ本文は変更できません。本文を直したいときは、エディタで直して新しく公開してください。</p>
      <form action={formAction} className={styles.form}>
        <label className={styles.field}>タイトル<input required name="title" maxLength={LIMITS.title} defaultValue={initial.title} className={styles.input} /></label>
        <label className={styles.field}>説明（任意）<input name="description" maxLength={LIMITS.description} defaultValue={initial.description} className={styles.input} /></label>
        <label className={styles.field}>タグ（カンマ区切り）<input name="tags" defaultValue={initial.tags.join(', ')} className={styles.input} /></label>
        {state.errors.length > 0 && (
          <ul role="alert" className={styles.errors}>{state.errors.map((message) => <li key={message}>{message}</li>)}</ul>
        )}
        <button type="submit" disabled={pending} className={styles.submit}>{pending ? '保存しています…' : '保存する'}</button>
      </form>
    </main>
  )
}
