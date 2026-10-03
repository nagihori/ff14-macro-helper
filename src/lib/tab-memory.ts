// ヘッダーのタブ（エディタ／ライブラリ）が、自分の最後のページを覚えておくための小さな置き場。
// 開いていないタブを押したら続きに戻り、いま開いているタブをもう一度押したら、そのタブの入口に戻る（iOS などのタブバーと同じ作法）。
// エディタ側は常に入口（/）で、本文などの状態は editor-draft.ts が写しを持つ。ここはライブラリ側のページだけを覚える。
// 翌日まで残したくないので sessionStorage（ブラウザのタブを閉じると消える）。使えない環境では、入口に戻るだけ。
const KEY = 'ff14-macro-last-library-path'

// 覚えるのは /macros 配下のページ。フィード（XML）などページではないものは覚えない。
export function isRememberablePath(pathname: string): boolean {
  return (pathname === '/macros' || pathname.startsWith('/macros/')) && !pathname.endsWith('.xml')
}

export function rememberLibraryPath(pathname: string) {
  if (!isRememberablePath(pathname)) return
  try { sessionStorage.setItem(KEY, pathname) } catch { /* 覚えられなくても、入口に戻るだけ */ }
}

export function recallLibraryPath(): string | null {
  try {
    const value = sessionStorage.getItem(KEY)
    return value && isRememberablePath(value) ? value : null
  } catch {
    return null
  }
}
