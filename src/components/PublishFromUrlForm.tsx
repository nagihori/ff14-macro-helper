'use client'

import Link from 'next/link'
import { useState } from 'react'
import { readOriginFromShareUrl } from '@/lib/share/url'
import styles from './PublishFromUrlForm.module.scss'

// URL・タイトル・タグだけを受け取る最小フォーム。DB 導入時は送信処理を API に置換する。
export function PublishFromUrlForm({ initialShareUrl = '', tagSuggestions, knownMacros }: { initialShareUrl?: string; tagSuggestions: string[]; knownMacros: { slug: string; title: string }[] }) {
  const [submitted, setSubmitted] = useState(false)
  const [tags, setTags] = useState('')
  const [shareUrl, setShareUrl] = useState(initialShareUrl)
  // 共有 URL にアレンジ元（from）が含まれていれば、公開時にバックリンクを張る元として表示する。
  const originSlug = readOriginFromShareUrl(shareUrl)
  const origin = originSlug ? knownMacros.find((macro) => macro.slug === originSlug) : undefined

  // タグ欄は「確定済み（カンマの手前）」と「入力中の最後の語」に分けて扱う。
  const parts = tags.split(',')
  const typing = parts[parts.length - 1].trim().replace(/^#/, '')
  const committed = parts.slice(0, -1).map((value) => value.trim()).filter(Boolean)
  // 入力中の語で候補を絞る。何も入力していなければ全候補を弱めに出す。
  const visibleSuggestions = tagSuggestions.filter((tag) => !committed.includes(tag) && tag.toLocaleLowerCase('ja-JP').includes(typing.toLocaleLowerCase('ja-JP')))

  // 入力中の語を選んだタグに置き換えて確定する。将来はこの候補群を投稿データではなくタグ辞書から取得する。
  function addTag(tag: string) {
    setTags([...committed, tag].join(', ') + ', ')
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
        <label className={styles.field}>共有 URL<input required type="url" value={shareUrl} onChange={(event) => setShareUrl(event.target.value)} placeholder="https://…" className={styles.input} /></label>
        {origin && <p role="status" className={styles.origin}>アレンジ元：<Link href={`/macros/${origin.slug}`} className={styles.leadLink}>{origin.title}</Link>。公開するとこのマクロへのリンクが付きます。</p>}
        <label className={styles.field}>タイトル<input required maxLength={60} placeholder="例：コンテンツ開始前の確認" className={styles.input} /></label>
        <div>
          <label className={styles.field}>タグ<input value={tags} onChange={(event) => setTags(event.target.value)} placeholder="例：パーティ, チャット" className={styles.input} /></label>
          <div className={styles.suggestions} aria-label="既存のタグ">{visibleSuggestions.map((tag) => <button key={tag} type="button" onClick={() => addTag(tag)} className={styles.suggestion}>#{tag}</button>)}</div>
        </div>
        <button type="submit" className={styles.submit}>公開内容を確認する</button>
        {submitted && <p role="status" className={styles.notice}>これは UI 試作です。次の実装で URL の検証、NG ワード確認、公開停止状態、Discord / X OAuth の投稿者識別をこの送信地点に追加します。</p>}
      </form>
    </main>
  )
}
