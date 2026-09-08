import type { MacroDocument } from '../macro/types'

const QUERY_KEY = 'm'

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
