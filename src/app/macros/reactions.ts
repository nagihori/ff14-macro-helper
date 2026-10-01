'use server'

import { cookies } from 'next/headers'
import { getSql } from '@/lib/db'

export type ReactionKind = 'helpful' | 'problem'
export type ReactionCounts = { helpful: number; problem: number }

const cookieName = (slug: string) => `ff14-macro-reaction-${slug}`
const isKind = (value: unknown): value is ReactionKind => value === 'helpful' || value === 'problem'

// 「役に立った」「不具合あり」の投票。next が null なら取り消し。
// 同じブラウザでの重複は Cookie で防ぐ（アカウント不要）。Cookie の現在値と next の差分だけを件数に反映する。
// Cookie は利用者が書き換えられるため厳密な不正対策ではなく、件数が負にならないことだけを保証する。
// 公開中のマクロにだけ投票できる。対象がなければ null を返す。
export async function setReaction(slug: string, next: ReactionKind | null): Promise<ReactionCounts | null> {
  if (next !== null && !isKind(next)) return null
  const store = await cookies()
  const stored = store.get(cookieName(slug))?.value
  const current = isKind(stored) ? stored : null

  const helpfulDelta = Number(next === 'helpful') - Number(current === 'helpful')
  const problemDelta = Number(next === 'problem') - Number(current === 'problem')
  const rows = await getSql().query(
    `update macros set helpful_count = greatest(0, helpful_count + $2), problem_count = greatest(0, problem_count + $3)
     where slug = $1 and status = 'published' returning helpful_count, problem_count`,
    [slug, helpfulDelta, problemDelta],
  )
  if (!rows[0]) return null

  if (next) store.set(cookieName(slug), next, { path: '/', maxAge: 31536000, sameSite: 'lax' })
  else store.delete(cookieName(slug))
  return { helpful: rows[0].helpful_count as number, problem: rows[0].problem_count as number }
}
