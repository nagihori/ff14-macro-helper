'use server'

import { randomBytes } from 'node:crypto'
import { cookies } from 'next/headers'
import { createShortLink } from '@/lib/share/short-link-store'
import { creatorKey, isOriginSlug, SHORT_LINK } from '@/lib/share/short-links'

const COOKIE = 'ff14-macro-creator'

// エディタの共有 URL を短くする。本文を保存して短い ID を返す。失敗・上限・DB 障害のときは null を返し、
// 呼び出し側は従来の長い共有 URL（?m=…）にそのまま切り替える（DB が無くても共有は動く）。
// 作った人は、ログインではなく Cookie（ランダムな値）で区別する。
export async function createShareId(body: string, originSlug: string | null): Promise<string | null> {
  if (typeof body !== 'string' || !body.trim() || body.length > SHORT_LINK.maxBodyLength) return null
  if (originSlug !== null && !(typeof originSlug === 'string' && isOriginSlug(originSlug))) return null
  try {
    const store = await cookies()
    let cookieValue = store.get(COOKIE)?.value
    if (!cookieValue || !/^[0-9a-f]{32}$/.test(cookieValue)) {
      cookieValue = randomBytes(16).toString('hex')
      store.set(COOKIE, cookieValue, { path: '/', maxAge: 31536000, httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production' })
    }
    const result = await createShortLink(creatorKey(cookieValue), body, originSlug)
    return result.ok ? result.id : null
  } catch (error) {
    console.error('[share] 短縮 URL を作れませんでした', error)
    return null
  }
}
