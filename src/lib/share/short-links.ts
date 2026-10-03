import { createHash, randomInt } from 'node:crypto'

// 短縮共有 URL の取り決め。保存・参照は short-link-store.ts、ここは DB に依存しない部分。
export const SHORT_LINK = {
  // 最後に開かれてから、この日数で期限切れ（開かれるたびに延びる）。
  expireDays: 180,
  // 1 人（Cookie）あたりの保存数。超えたら、最後に開かれてから最も古いものから消える。
  perCreatorLimit: 100,
  // 全体で、1 時間に作れる新規の数。超えたら作らず、呼び出し側は長い共有 URL にする。
  newPerHourLimit: 300,
  // 本文の長さの上限（マクロの上限 15 行・180 文字／行に余裕を持たせた値）。
  maxBodyLength: 4000,
} as const

// 読みやすさのため紛らわしい文字（0/o、1/l）を除いた英数字 8 文字（公開マクロの slug と同じ）。
const ID_CHARS = 'abcdefghijkmnpqrstuvwxyz23456789'
export const newShortId = () => Array.from({ length: 8 }, () => ID_CHARS[randomInt(ID_CHARS.length)]).join('')
export const isShortId = (value: string) => /^[a-km-z2-9]{8}$/.test(value)

const sha256 = (text: string) => createHash('sha256').update(text).digest('hex')

// Cookie の値そのものは保存せず、ハッシュで区別する。
export const creatorKey = (cookieValue: string) => sha256(`creator:${cookieValue}`)

// 同じ人が同じマクロ（アレンジ元も同じ）を共有し直したとき、1 件にまとめるための重複判定。
export const bodyHash = (body: string, originSlug: string | null) => sha256(`${originSlug ?? ''}\n${body}`)

// アレンジ元の slug として受け付ける形（公開マクロの slug は英数字 8 文字だが、余裕を持たせる）。
export const isOriginSlug = (value: string) => /^[A-Za-z0-9_-]{1,32}$/.test(value)
