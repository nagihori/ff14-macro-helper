// サイト名・既定の title / description。環境変数で差し替えられる（未設定なら下の既定値）。
// サーバー側（layout / page / OGP 画像）だけで読む。クライアント部品には props で渡す。
const readEnv = (value: string | undefined, fallback: string) => value?.trim() || fallback

export const BRAND_NAME = readEnv(process.env.BRAND_NAME, 'ff14-macro-helper')
export const DEFAULT_TITLE = readEnv(process.env.DEFAULT_TITLE, BRAND_NAME)
export const DEFAULT_DESCRIPTION = readEnv(process.env.DEFAULT_DESCRIPTION, 'FFXIV マクロの編集・診断・ログプレビュー・共有ツール')

// Google アナリティクス 4 の測定 ID（G-XXXXXXXXXX）。未設定、または形式が違えば計測しない。スクリプトへ埋め込むので形式を絞る。
const gaId = process.env.GA_MEASUREMENT_ID?.trim() ?? ''
export const GA_MEASUREMENT_ID = /^G-[A-Z0-9]{4,20}$/.test(gaId) ? gaId : ''
