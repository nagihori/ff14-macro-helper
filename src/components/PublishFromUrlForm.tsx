'use client'

import Link from 'next/link'
import { useActionState, useState, type ReactNode } from 'react'
import { readOriginFromShareUrl } from '@/lib/share/url'
import { LIMITS } from '@/lib/published-macros/publish'
import { submitMacro, type PublishState } from '@/app/macros/submit/actions'
import styles from './PublishFromUrlForm.module.scss'

// 共有 URL・タイトル・説明・タグ（初回のみ公開名）を受け取り、サーバーアクションで保存する。
// ログインしていなければフォームの代わりにログインの案内（loginSlot）を出す。
export function PublishFromUrlForm({ initialShareUrl = '', tagSuggestions, knownMacros, savedHandle, loginSlot }: { initialShareUrl?: string; tagSuggestions: string[]; knownMacros: { slug: string; title: string }[]; savedHandle: string | null; loginSlot?: ReactNode }) {
  const [state, formAction, pending] = useActionState(submitMacro, { errors: [] } satisfies PublishState)
  const [tags, setTags] = useState('')
  const [shareUrl, setShareUrl] = useState(initialShareUrl)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [handle, setHandle] = useState('')
  const [changingHandle, setChangingHandle] = useState(false)
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

  return (
    <main className={styles.formPage}>
      <Link href="/macros" className={styles.backLink}>← 公開マクロ一覧に戻る</Link>
      <h1 className={styles.title}>共有 URL から公開する</h1>
      <p className={styles.lead}><Link href="/" className={styles.leadLink}>エディタ</Link>で作ったマクロを共有できます。見つけやすいタイトルとタグを心がけてください。</p>
      {loginSlot ? (
        <div className={styles.form}>
          <p className={styles.notice}>投稿には Discord でのログインが必要です。取得するのはユーザー ID と表示名だけで、公開されることはありません。詳しくは<Link href="/privacy" className={styles.leadLink}>プライバシーポリシー</Link>をご覧ください。</p>
          <div>{loginSlot}</div>
        </div>
      ) : (
        <form action={formAction} className={styles.form}>
          <label className={styles.field}>共有 URL<input required type="url" name="shareUrl" value={shareUrl} onChange={(event) => setShareUrl(event.target.value)} placeholder="https://…" className={styles.input} /></label>
          {origin && <p role="status" className={styles.origin}>アレンジ元：<Link href={`/macros/${origin.slug}`} className={styles.leadLink}>{origin.title}</Link>。公開するとこのマクロへのリンクが付きます。</p>}
          <label className={styles.field}>タイトル<input required name="title" maxLength={LIMITS.title} value={title} onChange={(event) => setTitle(event.target.value)} placeholder="例：コンテンツ開始前の確認" className={styles.input} /></label>
          <label className={styles.field}>説明（任意）<input name="description" maxLength={LIMITS.description} value={description} onChange={(event) => setDescription(event.target.value)} placeholder="例：パーティの準備確認を呼びかけるマクロです。" className={styles.input} /></label>
          <div>
            <label className={styles.field}>タグ<input name="tags" value={tags} onChange={(event) => setTags(event.target.value)} placeholder="例：パーティ, チャット" className={styles.input} /></label>
            <div className={styles.suggestions} aria-label="既存のタグ">{visibleSuggestions.map((tag) => <button key={tag} type="button" onClick={() => addTag(tag)} className={styles.suggestion}>#{tag}</button>)}</div>
          </div>
          {savedHandle === null || changingHandle ? (
            <label className={styles.field}>{savedHandle === null ? '公開名（初回のみ）' : '公開名'}<input required name="handle" maxLength={LIMITS.handle} value={handle} onChange={(event) => setHandle(event.target.value)} placeholder="例：Moco" className={styles.input} />
              <span className={styles.hint}>
                投稿者として公開ページに表示される名前です。Discord のユーザー名とは別で、{savedHandle === null ? '以後は同じ名前を使います。' : '変更すると過去の投稿の表示も変わります。'}
                {savedHandle !== null && <> <button type="button" onClick={() => { setChangingHandle(false); setHandle('') }} className={styles.linkButton}>変更をやめる</button></>}
              </span>
            </label>
          ) : (
            <p className={styles.origin}>投稿者名：{savedHandle} <button type="button" onClick={() => { setHandle(savedHandle); setChangingHandle(true) }} className={styles.linkButton}>変更する</button></p>
          )}
          {state.errors.length > 0 && (
            <ul role="alert" className={styles.errors}>{state.errors.map((message) => <li key={message}>{message}</li>)}</ul>
          )}
          <button type="submit" disabled={pending} className={styles.submit}>{pending ? '公開しています…' : '公開する'}</button>
        </form>
      )}
    </main>
  )
}
