'use client'

import { useState } from 'react'
import { LIMITS } from '@/lib/published-macros/publish'
import styles from './PublishFromUrlForm.module.scss'

// 投稿フォームと編集フォームで共通の、タイトル・説明・タグの入力欄と案内（プレースホルダ・改行の説明・既存タグの候補）。
// 値は自分で持つ（React 19 のフォームアクションは、送信後に未制御の入力欄を初期値へ戻してしまうため。エラー時に入力が消えない）。
export function MacroMetaFields({ initial, tagSuggestions }: { initial?: { title: string; description: string; tags: string[] }; tagSuggestions: string[] }) {
  const [title, setTitle] = useState(initial?.title ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [tags, setTags] = useState(initial?.tags.join(', ') ?? '')

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
    <>
      <label className={styles.field}>タイトル<input required name="title" maxLength={LIMITS.title} value={title} onChange={(event) => setTitle(event.target.value)} placeholder="例：コンテンツ開始前の確認" className={styles.input} /></label>
      <label className={styles.field}>説明（任意）<textarea name="description" rows={2} maxLength={LIMITS.description} value={description} onChange={(event) => setDescription(event.target.value)} placeholder="例：定型文マクロです。CWLSに呼びかけることができます。あいさつなどに使ってください。" className={`${styles.input} ${styles.textarea}`} />
        <span className={styles.hint}>改行できます（{LIMITS.descriptionLines} 行まで・空行は不可）。他のマクロのURLを書くと、タイトルのリンクになります。</span></label>
      <div>
        <label className={styles.field}>タグ（カンマ区切り）<input name="tags" value={tags} onChange={(event) => setTags(event.target.value)} placeholder="例：パーティ, チャット" className={styles.input} /></label>
        <div className={styles.suggestions} aria-label="既存のタグ">{visibleSuggestions.map((tag) => <button key={tag} type="button" onClick={() => addTag(tag)} className={styles.suggestion}>#{tag}</button>)}</div>
      </div>
    </>
  )
}

// 15 行に収まらないマクロの案内（折りたたみ）。
export function ContinuedMacroGuide() {
  return (
    <details className={styles.accordion}>
      <summary className={styles.accordionSummary}>2つ以上のマクロにまたがる場合</summary>
      <p className={styles.hint}>15 行に収まらない続きのマクロは、前のマクロの詳細ページで「エディタで編集」を押し、続きを書いて投稿してください。前後のマクロが相互にリンクされます（タイトルは「〇〇 [2]」のように番号を付けると探しやすくなります）。説明に前後のマクロのURLを書いておくと、タイトルのリンクになります。</p>
    </details>
  )
}
