// エディタ本文の現在値と、チェックで問題が見つかった本文を、画面上の別々のボタン（エディタ内の操作）で共有する小さな置き場。
// 本文の正は MacroWorkbench の state。ここは写しで、再描画のトリガーにするのは checkedBody だけ。
// タブ（エディタ／ライブラリ）を行き来してもエディタの本文が消えないよう、sessionStorage にも写しを置く。
// 翌日まで残したくないので localStorage ではなく sessionStorage（ブラウザのタブを閉じると消える）。
const STORAGE_KEY = 'ff14-macro-editor-draft'
const ORIGIN_STORAGE_KEY = 'ff14-macro-editor-origin'
let currentBody = ''
let currentOrigin: string | null = null
let checkedBody: string | null = null
const listeners = new Set<() => void>()

export function setEditorDraft(body: string) { currentBody = body }
export function getEditorDraft(): string { return currentBody }

// アレンジ元の slug。URL の from はタブ移動で消えるので、本文と同じ理由でここに写しを置く。
export function setEditorOrigin(slug: string | null) { currentOrigin = slug }
export function getEditorOrigin(): string | null { return currentOrigin }

// sessionStorage が使えない環境（プライベートモードなど）でも、エディタ自体は動かす。
export function loadStoredDraft(): string | null {
  try { return sessionStorage.getItem(STORAGE_KEY) } catch { return null }
}
export function saveStoredDraft(body: string) {
  try { sessionStorage.setItem(STORAGE_KEY, body) } catch { /* 保存できなくても編集は続けられる */ }
}

export function loadStoredOrigin(): string | null {
  try { return sessionStorage.getItem(ORIGIN_STORAGE_KEY) } catch { return null }
}
export function saveStoredOrigin(slug: string | null) {
  try {
    if (slug === null) sessionStorage.removeItem(ORIGIN_STORAGE_KEY)
    else sessionStorage.setItem(ORIGIN_STORAGE_KEY, slug)
  } catch { /* 保存できなくても編集は続けられる */ }
}

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
