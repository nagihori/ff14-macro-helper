import { getDictionary } from '@/lib/commands/dictionary'
import { analyze } from '@/lib/macro/analyze'
import { decodeDocument, readOriginFromShareUrl, readShareParam } from '@/lib/share/url'

// 公開投稿の入力検証。UI や DB には依存しない（サーバーアクションと単体テストから使う）。
// クライアント側のチェックは信用せず、共有 URL の復号と lint をここでもう一度行う。
export const LIMITS = { title: 60, description: 200, handle: 20, tagLength: 20, tagCount: 5 } as const

export type PublishInput = { shareUrl: string; title: string; description: string; tags: string; handle: string }
export type ValidPublish = { body: string; originSlug: string | null; title: string; description: string; tags: string[]; handle: string }
export type PublishValidation = { ok: true; value: ValidPublish } | { ok: false; errors: string[] }

// カンマ（半角・全角・読点）区切り。先頭の # は外し、重複は除く。
export function parseTags(raw: string): string[] {
  const tags = raw.split(/[,、，]/).map((tag) => tag.trim().replace(/^[#＃]/, '').trim()).filter(Boolean)
  return [...new Set(tags)]
}

export type MetaInput = { title: string; description: string; tags: string }
export type ValidMeta = { title: string; description: string; tags: string[]; errors: string[] }

// タイトル・説明・タグの検証。投稿と、公開後の編集で共通。
export function validateMeta(input: MetaInput): ValidMeta {
  const errors: string[] = []
  const title = input.title.trim()
  if (!title) errors.push('タイトルを入力してください。')
  else if (title.length > LIMITS.title) errors.push(`タイトルは ${LIMITS.title} 文字以内にしてください。`)

  const description = input.description.trim()
  if (description.length > LIMITS.description) errors.push(`説明は ${LIMITS.description} 文字以内にしてください。`)

  const tags = parseTags(input.tags)
  if (tags.length > LIMITS.tagCount) errors.push(`タグは ${LIMITS.tagCount} 個までです。`)
  if (tags.some((tag) => tag.length > LIMITS.tagLength)) errors.push(`タグは 1 つ ${LIMITS.tagLength} 文字以内にしてください。`)
  if (tags.some((tag) => /\s/.test(tag))) errors.push('タグに空白は使えません。')

  return { title, description, tags, errors }
}

// needsHandle: 公開名をまだ覚えていないユーザー（初回投稿）。このとき handle は必須。
// 覚えているユーザーは handle が空なら今の名前のまま、入っていれば「変更」として扱う。
export function validatePublish(input: PublishInput, { needsHandle }: { needsHandle: boolean }): PublishValidation {
  const errors: string[] = []

  let body = ''
  let originSlug: string | null = null
  try {
    const url = new URL(input.shareUrl.trim())
    const decoded = decodeDocument(readShareParam(url.search) ?? '')
    if (!decoded.ok) {
      errors.push(decoded.reason === 'empty' ? '共有 URL にマクロ本文が含まれていません。' : '共有 URL からマクロ本文を読み取れませんでした。')
    } else {
      body = decoded.document.body
      originSlug = readOriginFromShareUrl(url.toString())
    }
  } catch {
    errors.push('共有 URL の形式が正しくありません。')
  }

  if (body) {
    // 打ちかけの最終行も確定扱いで判定する（コピー前チェックと同じ）。
    const problems = analyze(body, getDictionary(), { complete: true }).diagnostics.filter((diagnostic) => diagnostic.severity === 'error')
    for (const problem of problems) errors.push(`${problem.line} 行目：${problem.message}`)
  } else if (errors.length === 0) {
    errors.push('マクロ本文が空です。')
  }

  const meta = validateMeta(input)
  errors.push(...meta.errors)

  const handle = input.handle.trim()
  if (needsHandle && !handle) errors.push('公開名を入力してください（初回のみ）。')
  else if (handle.length > LIMITS.handle) errors.push(`公開名は ${LIMITS.handle} 文字以内にしてください。`)

  if (errors.length > 0) return { ok: false, errors }
  return { ok: true, value: { body, originSlug, title: meta.title, description: meta.description, tags: meta.tags, handle } }
}
