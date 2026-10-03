// X（旧 Twitter）で共有する。投稿画面を、本文を入れた状態で開く URL（intent）を作る。
// 文面は「{マクロ名} {URL} #タグ …」。説明文は入れない（投稿する人が自分の言葉で書けるように）。
// URL は文中に置く（X が自動で 23 文字として数える）。
export function buildXShareUrl({ title, url, hashtags }: { title: string; url: string; hashtags: string[] }): string {
  const tags = hashtags.map((tag) => tag.trim().replace(/^[#＃]/, '')).filter(Boolean).map((tag) => `#${tag}`)
  const text = [title.trim(), url, ...tags].filter(Boolean).join(' ')
  return `https://x.com/intent/post?text=${encodeURIComponent(text)}`
}
