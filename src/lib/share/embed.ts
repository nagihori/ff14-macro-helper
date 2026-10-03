// 埋め込み（iframe）のコードと高さ。表示側（components/EmbedViewer の CSS）と、この高さの計算をそろえておく。
// 高さ＝上のバー 44 + コード（上下の余白 24 + 1 行 21 × 見せる行数）+ 下のバー 40 + iframe の枠線 2 + 余裕 6。
// 見せる行数は 5〜12 行に収める（高さを抑えるため。12 行を超えるマクロは、コードの中でスクロールする）。
const EMBED_CHROME_HEIGHT = 44 + 24 + 40 + 2 + 6
const EMBED_LINE_HEIGHT = 21
const EMBED_MIN_LINES = 5
const EMBED_MAX_LINES = 12

export const embedHeight = (lineCount: number) => EMBED_CHROME_HEIGHT + EMBED_LINE_HEIGHT * Math.min(EMBED_MAX_LINES, Math.max(EMBED_MIN_LINES, lineCount))

const escapeAttr = (text: string) => text.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

// ブログなどに貼る iframe のコード。クリップボードへのコピーは、別オリジンの iframe では allow が無いと拒まれる。
export function buildEmbedCode({ siteUrl, slug, title, lineCount }: { siteUrl: string; slug: string; title: string; lineCount: number }): string {
  return `<iframe src="${siteUrl}/embed/${slug}" width="100%" height="${embedHeight(lineCount)}" style="border:1px solid #d4d4d8;border-radius:8px;max-width:100%" loading="lazy" allow="clipboard-write" title="${escapeAttr(title)}"></iframe>`
}
