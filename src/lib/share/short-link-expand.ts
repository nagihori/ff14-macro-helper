import { openShortLink } from './short-link-store'
import { isShortId } from './short-links'
import { buildShareUrl } from './url'

// 短縮共有 URL（/s/{id}）の ID を取り出す。このサイトのホスト（hosts）の、/s/{id} の形だけを受け付ける。
// それ以外（別のサイト・長い共有 URL・形の違うもの）は null で、呼び出し側はそのまま扱う。
export function parseShortShareUrl(value: string, hosts: (string | null | undefined)[]): string | null {
  try {
    const url = new URL(value.trim())
    if (!hosts.some((host) => host && host === url.host)) return null
    const match = url.pathname.match(/^\/s\/([^/]+)\/?$/)
    return match && isShortId(match[1]) ? match[1] : null
  } catch {
    return null
  }
}

export type ExpandResult = { ok: true; url: string } | { ok: false; reason: 'expired' | 'unavailable' }

// 公開フォームに短縮 URL が貼られたとき、サーバーで本文を引いて、従来の長い共有 URL（?m=…[&from=…]）に直す。
// 以降の検証（復号・lint）は、これまでの長い共有 URL と同じ経路を通る（クライアントの値は信用しない）。
// 期限切れ・存在しない ID は expired、DB に届かないときは unavailable。
export async function expandShortShareUrl(id: string, siteOrigin: string): Promise<ExpandResult> {
  try {
    const link = await openShortLink(id)
    if (!link) return { ok: false, reason: 'expired' }
    return { ok: true, url: buildShareUrl({ version: 1, body: link.body }, `${siteOrigin}/`, link.originSlug) }
  } catch (error) {
    console.error('[publish] 短縮 URL を読めませんでした', error)
    return { ok: false, reason: 'unavailable' }
  }
}
