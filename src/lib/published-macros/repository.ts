import { getSql } from '@/lib/db'
import type { PublishedMacro } from './types'

// 公開マクロの読み取り。停止中（status = 'suspended'）は、どの入口からも返さない。
// 日付は日本時間の YYYY/MM/DD に整形して返す。
const columns = `
  m.slug, m.title, m.description, m.body, m.tags, m.author_handle,
  to_char(m.published_at at time zone 'Asia/Tokyo', 'YYYY/MM/DD') as published_at,
  o.slug as arranged_from_slug, o.title as arranged_from_title, o.status as arranged_from_status,
  m.helpful_count, m.problem_count, m.status
`
// 元マクロが停止中なら、バックリンクは出さない。削除済みなら、タイトルだけ出す（リンクなし）。
const from = `
  from macros m
  left join macros o on o.id = m.arranged_from and o.status in ('published', 'deleted')
`

type Row = {
  slug: string; title: string; description: string; body: string; tags: string[]
  author_handle: string; published_at: string; arranged_from_slug: string | null
  arranged_from_title: string | null; arranged_from_status: 'published' | 'deleted' | null
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
    arrangedFrom: row.arranged_from_slug && row.arranged_from_title ? { slug: row.arranged_from_slug, title: row.arranged_from_title, deleted: row.arranged_from_status === 'deleted' } : undefined,
    reactions: { helpful: row.helpful_count, problem: row.problem_count },
    status: row.status,
  }
}

// 新しい順の一覧。
export async function listPublishedMacros(): Promise<PublishedMacro[]> {
  const rows = await getSql().query(`select ${columns} ${from} where m.status = 'published' order by m.published_at desc`)
  return (rows as Row[]).map(toMacro)
}

// 404 などで勧める公開マクロ。「役に立った」が多い順、同数なら新しい順。
export async function listRecommendedMacros(limit = 3): Promise<PublishedMacro[]> {
  const rows = await getSql().query(`select ${columns} ${from} where m.status = 'published' order by m.helpful_count desc, m.published_at desc limit $1`, [limit])
  return (rows as Row[]).map(toMacro)
}

// sitemap 用。公開中のマクロの slug と公開日時（ISO 8601）だけを新しい順に返す（本文などは読まない）。
export async function listSitemapEntries(): Promise<{ slug: string; publishedAt: string }[]> {
  const rows = await getSql().query(`select slug, to_char(published_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as published_at from macros where status = 'published' order by published_at desc`)
  return rows.map((row) => ({ slug: row.slug as string, publishedAt: row.published_at as string }))
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

// 派生マクロ：このマクロをアレンジ元にして投稿された公開中のマクロ。古い順（連続マクロの続きを順にたどれるように）。
export async function findDerivedMacros(slug: string): Promise<PublishedMacro[]> {
  const rows = await getSql().query(
    `select ${columns} ${from} where m.status = 'published' and o.slug = $1 order by m.published_at, m.slug`,
    [slug],
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

// ---- 停止中のマクロ（管理者と、その投稿者だけが見られる） ----

export type Viewer = { id: string; isAdmin: boolean }

// 公開中のマクロに加えて、閲覧者が管理者、または投稿者本人なら、停止中のものも 1 件引く。
export async function findMacroForViewer(slug: string, viewer?: Viewer): Promise<PublishedMacro | undefined> {
  const rows = await getSql().query(
    `select ${columns} ${from} where m.slug = $1 and m.status <> 'deleted' and (m.status = 'published' or $2::boolean or m.author_id = $3::uuid)`,
    [slug, viewer?.isAdmin ?? false, viewer?.id ?? null],
  )
  return rows[0] ? toMacro(rows[0] as Row) : undefined
}

// 停止中の一覧。管理者は全件、それ以外のログイン中の人は自分の投稿だけ。
export async function listSuspendedMacros(viewer: Viewer): Promise<PublishedMacro[]> {
  const rows = await getSql().query(
    `select ${columns} ${from} where m.status = 'suspended' and ($1::boolean or m.author_id = $2::uuid) order by m.suspended_at desc`,
    [viewer.isAdmin, viewer.id],
  )
  return (rows as Row[]).map(toMacro)
}

// 本人の投稿か（編集・削除の入口を出すかの判定。実行可否はサーバーアクションが改めて判定する）。
export async function isMacroAuthor(slug: string, userId: string): Promise<boolean> {
  const rows = await getSql().query(`select 1 from macros where slug = $1 and author_id = $2 and status <> 'deleted'`, [slug, userId])
  return rows.length > 0
}

// 説明内の他マクロへの URL をタイトルに展開するための引き当て。slug をまとめて 1 回で引く。
// 停止中・存在しないものは返さない（展開せず、書かれた URL のまま見せる）。削除済みはタイトルだけ返す。
export async function findMacroTitles(slugs: string[]): Promise<Map<string, { title: string; deleted: boolean }>> {
  if (slugs.length === 0) return new Map()
  const rows = await getSql().query(`select slug, title, status from macros where slug = any($1) and status in ('published', 'deleted')`, [slugs])
  return new Map(rows.map((row) => [row.slug as string, { title: row.title as string, deleted: row.status === 'deleted' }]))
}
