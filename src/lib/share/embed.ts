// 埋め込み（iframe）のコードと高さ。表示側（app/embed/[slug]）の CSS と、この高さの計算をそろえておく。
// 高さ＝ヘッダー 48 + コード（上下の余白 32 + 1 行 22 × 行数）+ 閉じた「動作プレビュー」59（本体 47 + 上の余白 12）+ フッター 40
// + iframe の枠線 2 + 余裕 8（実測：15 行のマクロで 509。ブラウザで /embed/{slug} の各要素の高さを測って決めた）。
const EMBED_CHROME_HEIGHT = 48 + 32 + 59 + 40 + 2 + 8
const EMBED_LINE_HEIGHT = 22

export const embedHeight = (lineCount: number) => EMBED_CHROME_HEIGHT + EMBED_LINE_HEIGHT * Math.max(1, lineCount)

const escapeAttr = (text: string) => text.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

// ブログなどに貼る iframe のコード。クリップボードへのコピーは、別オリジンの iframe では allow が無いと拒まれる。
export function buildEmbedCode({ siteUrl, slug, title, lineCount }: { siteUrl: string; slug: string; title: string; lineCount: number }): string {
  return `<iframe src="${siteUrl}/embed/${slug}" width="100%" height="${embedHeight(lineCount)}" style="border:1px solid #d4d4d8;border-radius:8px;max-width:100%" loading="lazy" allow="clipboard-write" title="${escapeAttr(title)}"></iframe>`
}
