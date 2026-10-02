'use server'

import { revalidatePath } from 'next/cache'
import { auth } from '@/auth'
import { isAdminAccountId } from '@/lib/admin'
import { redirect } from 'next/navigation'
import { getSql } from '@/lib/db'
import { deleteSuspendedMacro } from '@/lib/published-macros/store'

// 管理者だけが実行できる操作の入口。
// セッションの isAdmin は発行時点の値なので信用せず、users の Discord ID を ADMIN_DISCORD_IDS と毎回照合する。
async function assertAdmin(): Promise<void> {
  const session = await auth()
  if (!session?.user.id) throw new Error('ログインが必要です')
  const rows = await getSql().query('select provider, provider_account_id from users where id = $1', [session.user.id])
  if (rows[0]?.provider !== 'discord' || !isAdminAccountId(rows[0].provider_account_id as string)) throw new Error('管理者のみ実行できます')
}

// 公開停止／再公開。
export async function setMacroStatus(slug: string, status: 'published' | 'suspended'): Promise<void> {
  await assertAdmin()
  await getSql().query(
    `update macros set status = $2, suspended_at = case when $2 = 'suspended' then now() else null end where slug = $1 and status <> 'deleted'`,
    [slug, status],
  )
  revalidatePath('/macros')
  revalidatePath(`/macros/${slug}`)
}

// 公開停止中のマクロの削除（本文を残さず消す）。公開中のものは先に停止してから。
export async function deleteSuspendedMacroAsAdmin(slug: string): Promise<void> {
  await assertAdmin()
  if (!(await deleteSuspendedMacro(slug))) throw new Error('削除できるのは公開停止中のマクロだけです')
  revalidatePath('/macros')
  revalidatePath(`/macros/${slug}`)
  redirect('/macros')
}
