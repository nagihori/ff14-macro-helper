import type { TemplateMacro } from '@/lib/templates/search'
import { listPublishedMacrosWithTag } from './repository'

// 雛形は、タグ「雛形」が付いた公開マクロ。誰でも付けられる（質は「役に立った」の多い順で整える）。
export const TEMPLATE_TAG = '雛形'
const LIMIT = 30
const TTL_MS = 60 * 60 * 1000
const FAILURE_TTL_MS = 60 * 1000

// 一覧は小さいので、エディタを開くたびに DB へ聞かず、サーバーのメモリに 1 時間持つ（インスタンスごと）。
// DB に届かないときは空で返し（エディタは雛形なしで動く）、1 分だけ覚えて、障害中の問い合わせを減らす。
let cache: { at: number; ttl: number; value: TemplateMacro[] } | null = null

export async function loadTemplates(): Promise<TemplateMacro[]> {
  const now = Date.now()
  if (cache && now - cache.at < cache.ttl) return cache.value
  try {
    const macros = await listPublishedMacrosWithTag(TEMPLATE_TAG, LIMIT)
    const value = macros.map((macro) => ({ slug: macro.slug, title: macro.title, description: macro.description, body: macro.body, tags: macro.tags.filter((tag) => tag !== TEMPLATE_TAG) }))
    cache = { at: now, ttl: TTL_MS, value }
    return value
  } catch (error) {
    console.error('[templates] 雛形を読めませんでした', error)
    cache = { at: now, ttl: FAILURE_TTL_MS, value: [] }
    return []
  }
}
