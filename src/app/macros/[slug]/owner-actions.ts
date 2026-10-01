'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { validateMeta } from '@/lib/published-macros/publish'
import { deleteMacro, updateMacroMeta } from '@/lib/published-macros/store'

// 投稿者本人による編集・削除。許可は毎回 author_id との照合で判定する（画面の出し分けは信用しない）。
export type EditState = { errors: string[] }

const text = (formData: FormData, key: string) => (typeof formData.get(key) === 'string' ? (formData.get(key) as string) : '')

// 編集できるのはタイトル・説明・タグだけ。本文は直せない。
export async function updateMyMacro(slug: string, _previous: EditState, formData: FormData): Promise<EditState> {
  const session = await auth()
  if (!session?.user.id) return { errors: ['編集にはログインが必要です。'] }
  const meta = validateMeta({ title: text(formData, 'title'), description: text(formData, 'description'), tags: text(formData, 'tags') })
  if (meta.errors.length > 0) return { errors: meta.errors }

  let updated: boolean
  try {
    updated = await updateMacroMeta(session.user.id, slug, meta)
  } catch (error) {
    console.error('[edit] 保存に失敗', error)
    return { errors: ['保存に失敗しました。時間をおいてもう一度お試しください。'] }
  }
  if (!updated) return { errors: ['このマクロは編集できません（自分の公開中の投稿だけ編集できます）。'] }
  revalidatePath('/macros')
  revalidatePath(`/macros/${slug}`)
  redirect(`/macros/${slug}`)
}

export async function deleteMyMacro(slug: string): Promise<void> {
  const session = await auth()
  if (!session?.user.id) throw new Error('ログインが必要です')
  if (!(await deleteMacro(session.user.id, slug))) throw new Error('削除できるのは自分の投稿だけです')
  revalidatePath('/macros')
  revalidatePath(`/macros/${slug}`)
  redirect('/macros')
}
