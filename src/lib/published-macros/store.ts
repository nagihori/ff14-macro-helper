import { randomInt } from 'node:crypto'
import { getSql } from '@/lib/db'
import type { ValidPublish } from './publish'

// 公開マクロの書き込み。検証は publish.ts で済んでいる前提で、保存だけを担う。

export async function getUserHandle(userId: string): Promise<string | null> {
  const rows = await getSql().query('select public_handle from users where id = $1', [userId])
  return (rows[0]?.public_handle as string | null | undefined) ?? null
}

// 読みやすさのため紛らわしい文字（0/o、1/l）を除いた英数字 8 文字。
const SLUG_CHARS = 'abcdefghijkmnpqrstuvwxyz23456789'
function newSlug(): string {
  return Array.from({ length: 8 }, () => SLUG_CHARS[randomInt(SLUG_CHARS.length)]).join('')
}

// 公開名は、入力があれば登録・変更し（空なら今の名前のまま）、過去の自分の投稿の表示名も追従させる。
// 同じトランザクションでマクロを保存する。
// アレンジ元は、公開中の slug にだけ紐づける。slug の衝突（ごく稀）は作り直して数回まで再試行する。
export async function publishMacro(userId: string, value: ValidPublish): Promise<string> {
  const sql = getSql()
  for (let attempt = 0; attempt < 3; attempt++) {
    const slug = newSlug()
    try {
      await sql.transaction([
        sql.query('update users set public_handle = coalesce($2, public_handle) where id = $1', [userId, value.handle || null]),
        sql.query('update macros set author_handle = u.public_handle from users u where u.id = $1 and macros.author_id = u.id and macros.author_handle <> u.public_handle', [userId]),
        sql.query(
          `insert into macros (slug, title, description, body, tags, author_id, author_handle, arranged_from)
           values ($2, $3, $4, $5, $6, $1, (select public_handle from users where id = $1),
                   (select id from macros where slug = $7 and status = 'published'))`,
          [userId, slug, value.title, value.description, value.body, value.tags, value.originSlug],
        ),
      ])
      return slug
    } catch (error) {
      const code = (error as { code?: string }).code
      if (code === '23505' && attempt < 2) continue // slug の重複
      throw error
    }
  }
  throw new Error('slug を発番できませんでした')
}
