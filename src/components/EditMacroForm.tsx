'use client'

import Link from 'next/link'
import { useActionState } from 'react'
import { updateMyMacro, type EditState } from '@/app/macros/[slug]/owner-actions'
import { ContinuedMacroGuide, MacroMetaFields } from './MacroMetaFields'
import styles from './PublishFromUrlForm.module.scss'

// 公開済みマクロのタイトル・説明・タグの編集フォーム。マクロ本文は直せない（直すなら新しく公開する）。
export function EditMacroForm({ slug, initial, tagSuggestions }: { slug: string; initial: { title: string; description: string; tags: string[] }; tagSuggestions: string[] }) {
  const [state, formAction, pending] = useActionState(updateMyMacro.bind(null, slug), { errors: [] } satisfies EditState)
  return (
    <main className={styles.formPage}>
      <Link href={`/macros/${slug}`} className={styles.backLink}>← マクロに戻る</Link>
      <h1 className={styles.title}>タイトル・説明・タグを編集</h1>
      <p className={styles.lead}>マクロ本文は変更できません。本文を直したいときは、エディタで直して新しく公開してください。</p>
      <form action={formAction} className={styles.form}>
        <ContinuedMacroGuide />
        <MacroMetaFields initial={initial} tagSuggestions={tagSuggestions} />
        {state.errors.length > 0 && (
          <ul role="alert" className={styles.errors}>{state.errors.map((message) => <li key={message}>{message}</li>)}</ul>
        )}
        <button type="submit" disabled={pending} className={styles.submit}>{pending ? '保存しています…' : '保存する'}</button>
      </form>
    </main>
  )
}
