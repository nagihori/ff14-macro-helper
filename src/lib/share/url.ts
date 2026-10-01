import type { MacroDocument } from '../macro/types'

const QUERY_KEY = 'm'
// アレンジ元の公開マクロの slug。公開済みの識別子だけなので共有 URL に載せてよい。
const ORIGIN_KEY = 'from'

// URL は共有の正本。個人情報・トークン等の不要なメタデータを含めない（AGENTS.md）。
export function encodeDocument(document: MacroDocument): string {
  const json = JSON.stringify(document)
  const bytes = new TextEncoder().encode(json)
  let binary = ''
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte)
  })
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export type DecodeResult =
  | { ok: true; document: MacroDocument }
  | { ok: false; reason: 'empty' | 'malformed' | 'unsupported-version' }

export function decodeDocument(encoded: string): DecodeResult {
  if (!encoded) return { ok: false, reason: 'empty' }
  try {
    const base64 = encoded.replace(/-/g, '+').replace(/_/g, '/')
    const binary = atob(base64)
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0))
    const json = new TextDecoder().decode(bytes)
    const parsed = JSON.parse(json)

    if (typeof parsed !== 'object' || parsed === null) {
      return { ok: false, reason: 'malformed' }
    }
    if (parsed.version !== 1) {
      return { ok: false, reason: 'unsupported-version' }
    }
    if (typeof parsed.body !== 'string') {
      return { ok: false, reason: 'malformed' }
    }
    return { ok: true, document: { version: 1, body: parsed.body } }
  } catch {
    return { ok: false, reason: 'malformed' }
  }
}

export function buildShareUrl(document: MacroDocument, baseUrl: string): string {
  const url = new URL(baseUrl)
  url.searchParams.set(QUERY_KEY, encodeDocument(document))
  return url.toString()
}

export function readShareParam(search: string): string | null {
  return new URLSearchParams(search).get(QUERY_KEY)
}

// 貼り付けられた共有 URL から、アレンジ元の slug を取り出す（URL として不正・未指定なら null）。
export function readOriginFromShareUrl(value: string): string | null {
  try {
    return new URL(value).searchParams.get(ORIGIN_KEY)
  } catch {
    return null
  }
}

// 公開マクロの本文をエディタで開く URL。アレンジ元の slug を持ち回り、共有 URL にもそのまま引き継がれる。
export function buildEditorPath(document: MacroDocument, originSlug: string): string {
  return `/?${QUERY_KEY}=${encodeDocument(document)}&${ORIGIN_KEY}=${encodeURIComponent(originSlug)}`
}
