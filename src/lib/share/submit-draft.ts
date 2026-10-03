// 公開フォーム（/macros/submit）の入力途中の写し。エディタで見比べようとタブ（エディタ／ライブラリ）を移っても、入力が消えないように
// sessionStorage に置く。エディタの本文の写し（editor-draft.ts）と同じ理由で、翌日まで残さないよう localStorage ではなく sessionStorage。
// 投稿に成功したら消す。sessionStorage が使えない環境（プライベートモードなど）でも、フォーム自体は動かす。
export type SubmitDraft = { shareUrl: string; title: string; description: string; tags: string; handle: string }

const KEY = 'ff14-macro-submit-draft'

export function loadSubmitDraft(): SubmitDraft | null {
  try {
    const raw = sessionStorage.getItem(KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    const keys: (keyof SubmitDraft)[] = ['shareUrl', 'title', 'description', 'tags', 'handle']
    return keys.every((key) => typeof parsed?.[key] === 'string') ? (parsed as SubmitDraft) : null
  } catch {
    return null
  }
}

export function saveSubmitDraft(draft: SubmitDraft) {
  try { sessionStorage.setItem(KEY, JSON.stringify(draft)) } catch { /* 保存できなくても入力は続けられる */ }
}

export function clearSubmitDraft() {
  try { sessionStorage.removeItem(KEY) } catch { /* 同上 */ }
}
