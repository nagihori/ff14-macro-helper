// エディタ本文の現在値と、チェックで問題が見つかった本文を、画面上の別々のボタン（エディタ内・ヘッダの「公開する」）で共有する小さな置き場。
// 本文の正は MacroWorkbench の state。ここは写しで、再描画のトリガーにするのは checkedBody だけ。
let currentBody = ''
let checkedBody: string | null = null
const listeners = new Set<() => void>()

export function setEditorDraft(body: string) { currentBody = body }
export function getEditorDraft(): string { return currentBody }

// チェックで問題が見つかった本文。同じ本文のあいだ、エディタは最終行も確定扱いで波線を出す。
export function setCheckedBody(body: string | null) {
  checkedBody = body
  listeners.forEach((listener) => listener())
}
export function getCheckedBody(): string | null { return checkedBody }
export function subscribeCheckedBody(listener: () => void) {
  listeners.add(listener)
  return () => { listeners.delete(listener) }
}
