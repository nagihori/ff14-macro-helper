import { MAX_LINES } from '../macro/lint'

// 本文が「まだ何も書いていない」状態か（空、または書き始めの「/」だけ）。
export const isEditorEmpty = (body: string) => body.trim() === '' || body.trim() === '/'

export type InsertResult = { ok: true; body: string; cursor: number } | { ok: false; reason: 'too-many-lines' }

// 雛形を、いまの本文に差し込む。
// top：先頭の行の前に入れる（/merror off や /micon のように、冒頭に置くものの向き）。
// after-cursor：カーソルのある行の下に入れる。その行が空、または書き始めの「/」だけなら、その行を置き換える。
// 行数の上限（MAX_LINES）を超えるときは差し込まない。カーソルは、差し込んだ雛形の末尾に置く。
export function insertTemplate(body: string, cursor: number, templateBody: string, where: 'top' | 'after-cursor'): InsertResult {
  const lines = body.split('\n')
  const added = templateBody.split('\n')
  let index = 0
  let replace = false
  if (where === 'after-cursor') {
    index = body.slice(0, Math.min(cursor, body.length)).split('\n').length - 1
    const current = lines[index].trim()
    replace = current === '' || current === '/'
    if (!replace) index += 1
  } else if (lines.length === 1 && isEditorEmpty(body)) {
    replace = true
  }
  const next = [...lines.slice(0, index), ...added, ...lines.slice(index + (replace ? 1 : 0))]
  if (next.length > MAX_LINES) return { ok: false, reason: 'too-many-lines' }
  const newBody = next.join('\n')
  const cursorAt = next.slice(0, index + added.length).join('\n').length
  return { ok: true, body: newBody, cursor: cursorAt }
}
