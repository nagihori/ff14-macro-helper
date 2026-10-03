'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useActionState, useEffect, useState, type ReactNode } from 'react'
import { readOriginFromShareUrl, removeOriginFromShareUrl } from '@/lib/share/url'
import { LIMITS } from '@/lib/published-macros/publish'
import { submitMacro, type PublishState } from '@/app/macros/submit/actions'
import { clearSubmitDraft, loadSubmitDraft, saveSubmitDraft } from '@/lib/share/submit-draft'
import { ContinuedMacroGuide, MacroMetaFields, type MetaValues } from './MacroMetaFields'
import { SharedMacroPreview } from './SharedMacroPreview'
import styles from './PublishFromUrlForm.module.scss'

// 共有URL・タイトル・説明・タグ（初回のみ公開名）を受け取り、サーバーアクションで保存する。
// ログインしていなければフォームの代わりにログインの案内（loginSlot）を出す。
export function PublishFromUrlForm({ initialShareUrl = '', tagSuggestions, knownMacros, savedHandle, loginSlot }: { initialShareUrl?: string; tagSuggestions: string[]; knownMacros: { slug: string; title: string }[]; savedHandle: string | null; loginSlot?: ReactNode }) {
  const [state, formAction, pending] = useActionState(submitMacro, { errors: [] } satisfies PublishState)
  const [shareUrl, setShareUrl] = useState(initialShareUrl)
  const [meta, setMeta] = useState<MetaValues>({ title: '', description: '', tags: '' })
  const [handle, setHandle] = useState('')
  const [changingHandle, setChangingHandle] = useState(false)
  const router = useRouter()

  // 入力途中の写し（sessionStorage）。エディタに切り替えて見比べても、戻ったときに消えないようにする。
  // 優先順：エディタの「公開する」で渡された共有 URL（?url=）→ 写し。違う共有 URL で来たら、前の写しは捨てる（別のマクロのため）。
  // 復元はマウント後の 1 回だけ（サーバー描画との不一致を避ける）。復元が済むまでは保存しない（空の値で写しを上書きしないため）。
  const [restored, setRestored] = useState(false)
  useEffect(() => {
    const stored = loadSubmitDraft()
    if (stored && (!initialShareUrl || stored.shareUrl === initialShareUrl)) {
      /* eslint-disable react-hooks/set-state-in-effect -- sessionStorage という外部システムからのマウント時 1 回限りの復元 */
      setShareUrl(stored.shareUrl)
      setMeta({ title: stored.title, description: stored.description, tags: stored.tags })
      if (stored.handle) { setHandle(stored.handle); if (savedHandle !== null) setChangingHandle(true) }
      /* eslint-enable react-hooks/set-state-in-effect */
    } else if (stored) {
      clearSubmitDraft()
    }
    setRestored(true)
  }, [initialShareUrl, savedHandle])
  useEffect(() => {
    if (restored) saveSubmitDraft({ shareUrl, ...meta, handle })
  }, [restored, shareUrl, meta, handle])
  // 投稿に成功したら、写しを消して、できたマクロのページへ移る。
  useEffect(() => {
    if (!state.slug) return
    clearSubmitDraft()
    router.push(`/macros/${state.slug}`)
  }, [state.slug, router])
  // 共有URLにアレンジ元（from）が含まれていれば、公開時にバックリンクを張る元として表示する。
  const originSlug = readOriginFromShareUrl(shareUrl)
  const origin = originSlug ? knownMacros.find((macro) => macro.slug === originSlug) : undefined

  return (
    <main className={styles.formPage}>
      <Link href="/macros" className={styles.backLink}>← 公開マクロ一覧に戻る</Link>
      <h1 className={styles.title}>共有URLから投稿する</h1>
      <p className={styles.lead}><Link href="/" className={styles.leadLink}>エディタ</Link>で作ったマクロを共有できます。見つけやすいタイトルとタグを心がけてください。</p>
      {loginSlot ? (
        <div className={styles.form}>
          <p className={styles.notice}>投稿には Discord でのログインが必要です。取得するのはユーザー ID と表示名だけで、公開されることはありません。詳しくは<Link href="/privacy" className={styles.leadLink}>プライバシーポリシー</Link>をご覧ください。</p>
          <div>{loginSlot}</div>
        </div>
      ) : (
        <form action={formAction} className={styles.form}>
          <label className={styles.field}>共有URL<input required type="url" name="shareUrl" value={shareUrl} onChange={(event) => setShareUrl(event.target.value)} placeholder="https://…" className={styles.input} /></label>
          {!origin && <ContinuedMacroGuide />}
          {origin && (
            <p role="status" className={styles.origin}>
              アレンジ元：<Link href={`/macros/${origin.slug}`} className={styles.leadLink}>{origin.title}</Link>
              <button type="button" onClick={() => setShareUrl(removeOriginFromShareUrl(shareUrl))} title="アレンジ元を外す" aria-label="アレンジ元を外す" className={styles.cancel}>×</button>
              <br />公開するとこのマクロへのリンクが付きます。
            </p>
          )}
          <SharedMacroPreview shareUrl={shareUrl} />
          <MacroMetaFields tagSuggestions={tagSuggestions} controlled={{ value: meta, onChange: setMeta }} />
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
          <button type="submit" disabled={pending} className={styles.submit}>{pending ? '投稿しています…' : '投稿する'}</button>
        </form>
      )}
    </main>
  )
}
