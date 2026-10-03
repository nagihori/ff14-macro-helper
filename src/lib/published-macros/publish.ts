import { getDictionary } from '@/lib/commands/dictionary'
import { analyze } from '@/lib/macro/analyze'
import { decodeDocument, readOriginFromShareUrl, readShareParam } from '@/lib/share/url'

// 公開投稿の入力検証。UI や DB には依存しない（サーバーアクションと単体テストから使う）。
// クライアント側のチェックは信用せず、共有URLの復号と lint をここでもう一度行う。
// 運営を名乗る・なりすます公開名を断る語。照合は normalizeHandle のあとの「含む」で行う（「【公式】Moco」なども対象）。
export const RESERVED_HANDLE_WORDS = ['運営', '管理人', '管理者', '公式', '事務局', 'admin', 'moderator', 'staff', 'official', 'system'] as const

// 全角半角・大文字小文字・空白の違いを無視した形。DB の users.public_handle_key（生成列）と同じ規則。
export function normalizeHandle(handle: string): string {
  return handle.normalize('NFKC').replace(/\s/g, '').toLowerCase()
}

export const LIMITS = { title: 60, description: 200, descriptionLines: 5, handle: 20, tagLength: 20, tagCount: 5 } as const

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

  // 説明は改行できる（最大 LIMITS.descriptionLines 行・空行は不可）。改行コードは \n にそろえる。
  const description = input.description.replace(/\r\n?/g, '\n').trim()
  if (description.length > LIMITS.description) errors.push(`説明は ${LIMITS.description} 文字以内にしてください。`)
  if (description) {
    const lines = description.split('\n')
    if (lines.length > LIMITS.descriptionLines) errors.push(`説明は ${LIMITS.descriptionLines} 行までです。`)
    if (lines.some((line) => !line.trim())) errors.push('説明に空行は使えません。')
  }

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
      errors.push(decoded.reason === 'empty' ? '共有URLにマクロ本文が含まれていません。' : '共有URLからマクロ本文を読み取れませんでした。')
    } else {
      body = decoded.document.body
      originSlug = readOriginFromShareUrl(url.toString())
    }
  } catch {
    errors.push('共有URLの形式が正しくありません。')
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
  else if (handle && RESERVED_HANDLE_WORDS.some((word) => normalizeHandle(handle).includes(word))) errors.push('その公開名は運営と紛らわしいため使えません。別の名前にしてください。')

  if (errors.length > 0) return { ok: false, errors }
  return { ok: true, value: { body, originSlug, title: meta.title, description: meta.description, tags: meta.tags, handle } }
}
