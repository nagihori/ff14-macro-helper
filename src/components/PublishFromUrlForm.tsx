'use client'

import Link from 'next/link'
import { useState } from 'react'
import { samplePublishedMacros } from '@/lib/published-macros/sample-data'
import styles from './PublishFromUrlForm.module.scss'

const tagSuggestions = [...new Set(samplePublishedMacros.flatMap((macro) => macro.tags))]

// URL・タイトル・タグだけを受け取る最小フォーム。DB 導入時は送信処理を API に置換する。
export function PublishFromUrlForm() {
  const [submitted, setSubmitted] = useState(false)
  const [tags, setTags] = useState('')

  // 候補タグを末尾へ足す。将来はこの候補群を投稿データではなくタグ辞書から取得する。
  function addTag(tag: string) {
    const existing = tags.split(',').map((value) => value.trim()).filter(Boolean)
    if (!existing.includes(tag)) setTags([...existing, tag].join(', '))
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitted(true)
  }

  return (
    <main className={styles.formPage}>
      <Link href="/macros" className={styles.backLink}>← 公開マクロ一覧に戻る</Link>
      <h1 className={styles.title}>共有 URL から公開する</h1>
      <p className={styles.lead}><Link href="/" className={styles.leadLink}>エディタ</Link>で作ったマクロを共有できます。見つけやすいタイトルとタグを心がけてください。</p>
      <form onSubmit={handleSubmit} className={styles.form}>
        <label className={styles.field}>共有 URL<input required type="url" placeholder="https://…" className={styles.input} /></label>
        <label className={styles.field}>タイトル<input required maxLength={60} placeholder="例：コンテンツ開始前の確認" className={styles.input} /></label>
        <label className={styles.field}>タグ<input value={tags} onChange={(event) => setTags(event.target.value)} placeholder="例：パーティ, チャット" className={styles.input} /></label>
        <div>
          <p className={styles.suggestionsLabel}>候補</p>
          <div className={styles.suggestions}>{tagSuggestions.map((tag) => <button key={tag} type="button" onClick={() => addTag(tag)} className={styles.suggestion}>#{tag}</button>)}</div>
        </div>
        <button type="submit" className={styles.submit}>公開内容を確認する</button>
        {submitted && <p role="status" className={styles.notice}>これは UI 試作です。次の実装で URL の検証、NG ワード確認、公開停止状態、Discord / X OAuth の投稿者識別をこの送信地点に追加します。</p>}
      </form>
    </main>
  )
}
