// サイト名・既定の title / description。環境変数で差し替えられる（未設定なら下の既定値）。
// サーバー側（layout / page / OGP 画像）だけで読む。クライアント部品には props で渡す。
const readEnv = (value: string | undefined, fallback: string) => value?.trim() || fallback

export const BRAND_NAME = readEnv(process.env.BRAND_NAME, 'ff14-macro-helper')
export const DEFAULT_TITLE = readEnv(process.env.DEFAULT_TITLE, BRAND_NAME)
export const DEFAULT_DESCRIPTION = readEnv(process.env.DEFAULT_DESCRIPTION, 'FFXIV マクロの編集・診断・ログプレビュー・共有ツール')
