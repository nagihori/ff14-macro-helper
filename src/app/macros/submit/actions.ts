'use server'

import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { validatePublish, type PublishInput } from '@/lib/published-macros/publish'
import { getUserHandle, HandleTakenError, publishMacro } from '@/lib/published-macros/store'
import { expandShortShareUrl, parseShortShareUrl } from '@/lib/share/short-link-expand'
import { getSiteUrl } from '@/lib/site-url'

export type PublishState = { errors: string[] }

const text = (formData: FormData, key: string) => (typeof formData.get(key) === 'string' ? (formData.get(key) as string) : '')

// 公開フォームの送信。ログイン必須。共有URLの復号と lint をサーバー側でもう一度行い、通ったものだけ保存する。
export async function submitMacro(_previous: PublishState, formData: FormData): Promise<PublishState> {
  const values: PublishInput = { shareUrl: text(formData, 'shareUrl'), title: text(formData, 'title'), description: text(formData, 'description'), tags: text(formData, 'tags'), handle: text(formData, 'handle') }
  const session = await auth()
  if (!session?.user.id) return { errors: ['投稿には Discord でのログインが必要です。'] }

  // 短縮共有 URL（/s/{id}）は、サーバーで本文を引いて長い共有 URL に直してから、同じ検証にかける。
  const site = new URL(getSiteUrl())
  const requestHost = (await headers()).get('host')
  const shortId = parseShortShareUrl(values.shareUrl, [requestHost, site.host])
  if (shortId) {
    const expanded = await expandShortShareUrl(shortId, site.origin)
    if (!expanded.ok) return { errors: [expanded.reason === 'expired' ? '共有リンクの期限が切れているか、見つかりません。エディタで共有URLを作り直してください。' : '共有リンクを読み込めませんでした。時間をおいてもう一度お試しください。'] }
    values.shareUrl = expanded.url
  }

  const savedHandle = await getUserHandle(session.user.id)
  const result = validatePublish(values, { needsHandle: savedHandle === null })
  if (!result.ok) return { errors: result.errors }

  let slug: string
  try {
    slug = await publishMacro(session.user.id, result.value)
  } catch (error) {
    if (error instanceof HandleTakenError) return { errors: ['その公開名はすでに使われています。別の名前にしてください。'] }
    console.error('[publish] 保存に失敗', error)
    return { errors: ['保存に失敗しました。時間をおいてもう一度お試しください。'] }
  }
  redirect(`/macros/${slug}`)
}
