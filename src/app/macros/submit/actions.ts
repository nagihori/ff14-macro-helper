'use server'

import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { validatePublish, type PublishInput } from '@/lib/published-macros/publish'
import { getUserHandle, publishMacro } from '@/lib/published-macros/store'

export type PublishState = { errors: string[] }

const text = (formData: FormData, key: string) => (typeof formData.get(key) === 'string' ? (formData.get(key) as string) : '')

// 公開フォームの送信。ログイン必須。共有 URL の復号と lint をサーバー側でもう一度行い、通ったものだけ保存する。
export async function submitMacro(_previous: PublishState, formData: FormData): Promise<PublishState> {
  const values: PublishInput = { shareUrl: text(formData, 'shareUrl'), title: text(formData, 'title'), description: text(formData, 'description'), tags: text(formData, 'tags'), handle: text(formData, 'handle') }
  const session = await auth()
  if (!session?.user.id) return { errors: ['投稿には Discord でのログインが必要です。'] }

  const savedHandle = await getUserHandle(session.user.id)
  const result = validatePublish(values, { needsHandle: savedHandle === null })
  if (!result.ok) return { errors: result.errors }

  let slug: string
  try {
    slug = await publishMacro(session.user.id, result.value)
  } catch (error) {
    console.error('[publish] 保存に失敗', error)
    return { errors: ['保存に失敗しました。時間をおいてもう一度お試しください。'] }
  }
  redirect(`/macros/${slug}`)
}
