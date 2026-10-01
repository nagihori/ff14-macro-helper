// マクロエディタのショートカット。素の Ctrl+C / P / S はブラウザや OS の標準操作と衝突するため、
// Ctrl+Alt（Mac は ⌃⌥）の組み合わせにする。Alt で入力される文字が変わるので、キー判定は event.code で行う。
export const SHORTCUTS = {
  copy: { code: 'KeyC', letter: 'C' },
  preview: { code: 'KeyP', letter: 'P' },
  share: { code: 'KeyS', letter: 'S' },
} as const

export type ShortcutName = keyof typeof SHORTCUTS

export function matchShortcut(event: KeyboardEvent): ShortcutName | null {
  if (!event.ctrlKey || !event.altKey || event.metaKey || event.shiftKey) return null
  for (const name of Object.keys(SHORTCUTS) as ShortcutName[]) {
    if (SHORTCUTS[name].code === event.code) return name
  }
  return null
}

// 表示用（title）。Mac は ⌃⌥C、それ以外は Ctrl+Alt+C。
export function formatShortcut(name: ShortcutName, isMac: boolean): string {
  const letter = SHORTCUTS[name].letter
  return isMac ? `⌃⌥${letter}` : `Ctrl+Alt+${letter}`
}

// aria-keyshortcuts 用（仕様の表記）。
export function ariaShortcut(name: ShortcutName): string {
  return `Control+Alt+${SHORTCUTS[name].letter}`
}
