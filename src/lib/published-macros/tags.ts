// タグ別一覧ページ（/macros/tag/[tag]）の URL と、検索エンジンに載せる基準。
// 1 件だけのタグは中身が薄いので、noindex にして sitemap にも入れない（件数が増えれば自動で載る）。
export const MIN_INDEXABLE_TAG_MACROS = 2

export const tagPath = (tag: string) => `/macros/tag/${encodeURIComponent(tag)}`
