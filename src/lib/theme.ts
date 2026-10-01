// ライト/ダークの手動切り替え。保存先は localStorage（このブラウザだけの設定。URL・サーバーには載せない）。
// 未設定のときは data-theme を付けず、OS の設定（prefers-color-scheme）に従う。
export const THEME_STORAGE_KEY = 'ff14-macro-theme'

export type Theme = 'light' | 'dark'

// 初回描画の前に実行して、保存済みの設定を <html> に反映する（読み込み直後のちらつき防止）。
export const themeInitScript = `try{var t=localStorage.getItem('${THEME_STORAGE_KEY}');if(t==='light'||t==='dark')document.documentElement.dataset.theme=t}catch(e){}`
