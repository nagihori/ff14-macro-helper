// このサイトの絶対 URL の基準（末尾スラッシュなし）。本番ドメインは SITE_URL で指定する。
// 未設定なら Vercel が付ける本番 URL、ローカルは localhost。共有カードの基準と、説明内のマクロ URL の判別で共用する。
export function getSiteUrl(): string {
  const url = process.env.SITE_URL ?? (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : 'http://localhost:3000')
  return url.replace(/\/+$/, '')
}
