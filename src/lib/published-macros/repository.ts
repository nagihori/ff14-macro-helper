import { getSql } from '@/lib/db'
import type { PublishedMacro } from './types'

// 公開マクロの読み取り。停止中（status = 'suspended'）は、どの入口からも返さない。
// 日付は日本時間の YYYY/MM/DD に整形して返す。
const columns = `
  m.slug, m.title, m.description, m.body, m.tags, m.author_handle,
  to_char(m.published_at at time zone 'Asia/Tokyo', 'YYYY/MM/DD') as published_at,
  o.slug as arranged_from_slug,
  m.helpful_count, m.problem_count, m.status
`
// 元マクロが停止中なら、バックリンクは張らない。
const from = `
  from macros m
  left join macros o on o.id = m.arranged_from and o.status = 'published'
`

type Row = {
  slug: string; title: string; description: string; body: string; tags: string[]
  author_handle: string; published_at: string; arranged_from_slug: string | null
  helpful_count: number; problem_count: number; status: 'published' | 'suspended'
}

function toMacro(row: Row): PublishedMacro {
  return {
    slug: row.slug,
    title: row.title,
    description: row.description,
    tags: row.tags,
    body: row.body,
    authorHandle: row.author_handle,
    publishedAt: row.published_at,
    arrangedFrom: row.arranged_from_slug ?? undefined,
    reactions: { helpful: row.helpful_count, problem: row.problem_count },
    status: row.status,
  }
}

// 新しい順の一覧。
export async function listPublishedMacros(): Promise<PublishedMacro[]> {
  const rows = await getSql().query(`select ${columns} ${from} where m.status = 'published' order by m.published_at desc`)
  return (rows as Row[]).map(toMacro)
}

export async function findPublishedMacro(slug: string): Promise<PublishedMacro | undefined> {
  const rows = await getSql().query(`select ${columns} ${from} where m.status = 'published' and m.slug = $1`, [slug])
  return rows[0] ? toMacro(rows[0] as Row) : undefined
}

// 似たマクロ：共通タグの数が多い順（同数なら新しい順）に最大 limit 件。共通タグがないものは含めない。
export async function findRelatedMacros(slug: string, limit = 3): Promise<PublishedMacro[]> {
  const rows = await getSql().query(
    `select ${columns} ${from}
     join macros base on base.slug = $1
     where m.status = 'published' and m.slug <> $1 and m.tags && base.tags
     order by cardinality(array(select unnest(m.tags) intersect select unnest(base.tags))) desc, m.published_at desc
     limit $2`,
    [slug, limit],
  )
  return (rows as Row[]).map(toMacro)
}

// タグ辞書の代わり。公開中のマクロに付いているタグを、使われている数の多い順に返す。
export async function listTags(): Promise<string[]> {
  const rows = await getSql().query(
    `select tag from macros m, unnest(m.tags) as tag where m.status = 'published' group by tag order by count(*) desc, tag`,
  )
  return rows.map((row) => row.tag as string)
}

// ---- 管理者向け（呼び出し側で isAdmin を確認すること） ----

// 停止中も含めて 1 件引く。停止中のマクロを見て、再公開するための入口。
export async function findMacroIncludingSuspended(slug: string): Promise<PublishedMacro | undefined> {
  const rows = await getSql().query(`select ${columns} ${from} where m.slug = $1`, [slug])
  return rows[0] ? toMacro(rows[0] as Row) : undefined
}

export async function listSuspendedMacros(): Promise<PublishedMacro[]> {
  const rows = await getSql().query(`select ${columns} ${from} where m.status = 'suspended' order by m.suspended_at desc`)
  return (rows as Row[]).map(toMacro)
}
