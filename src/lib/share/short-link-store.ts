import { getSql } from '@/lib/db'
import { bodyHash, newShortId, SHORT_LINK } from './short-links'

// 短縮共有 URL の保存と参照（db/migrations/0005_short_shares.sql）。取り決めは short-links.ts。
const expired = `now() - interval '${SHORT_LINK.expireDays} days'`

export type CreateResult = { ok: true; id: string } | { ok: false; reason: 'busy' }

// 本文を保存して ID を返す。同じ人が同じマクロを共有し直したら、同じ ID を返して期限を延ばす。
// 全体の新規作成が多すぎるとき（荒らし対策）は作らない。呼び出し側は長い共有 URL に切り替える。
export async function createShortLink(creator: string, body: string, originSlug: string | null): Promise<CreateResult> {
  const sql = getSql()
  const hash = bodyHash(body, originSlug)

  const existing = await sql.query('update shared_macros set last_opened_at = now() where creator = $1 and body_hash = $2 returning id', [creator, hash])
  if (existing[0]) return { ok: true, id: existing[0].id as string }

  const recent = await sql.query("select count(*)::int as n from shared_macros where created_at > now() - interval '1 hour'")
  if ((recent[0].n as number) >= SHORT_LINK.newPerHourLimit) return { ok: false, reason: 'busy' }

  // 期限切れの掃除と、この人の保存数を上限に収める（最後に開かれてから最も古いものから消す）。
  await sql.query(`delete from shared_macros where last_opened_at < ${expired}`)
  await sql.query(
    `delete from shared_macros where id in (select id from shared_macros where creator = $1 order by last_opened_at desc offset $2)`,
    [creator, SHORT_LINK.perCreatorLimit - 1],
  )

  // ID の衝突（ごく稀）は作り直して数回まで再試行する。
  for (let attempt = 0; attempt < 3; attempt++) {
    const id = newShortId()
    const inserted = await sql.query(
      'insert into shared_macros (id, creator, body, origin_slug, body_hash) values ($1, $2, $3, $4, $5) on conflict do nothing returning id',
      [id, creator, body, originSlug, hash],
    )
    if (inserted[0]) return { ok: true, id }
  }
  return { ok: false, reason: 'busy' }
}

// ID から本文を引く。期限内なら、1 日以上前の最終参照を今に更新して期限を延ばす（開くたびの書き込みを避ける）。
export async function openShortLink(id: string): Promise<{ body: string; originSlug: string | null } | null> {
  const sql = getSql()
  const rows = await sql.query(`select body, origin_slug, last_opened_at > ${expired} as alive from shared_macros where id = $1`, [id])
  const row = rows[0]
  if (!row) return null
  if (!row.alive) {
    await sql.query('delete from shared_macros where id = $1', [id])
    return null
  }
  await sql.query("update shared_macros set last_opened_at = now() where id = $1 and last_opened_at < now() - interval '1 day'", [id])
  return { body: row.body as string, originSlug: (row.origin_slug as string | null) ?? null }
}
