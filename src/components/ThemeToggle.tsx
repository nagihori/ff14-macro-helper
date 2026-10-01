'use client'

import { useSyncExternalStore } from 'react'
import { THEME_STORAGE_KEY, type Theme } from '@/lib/theme'
import styles from './ThemeToggle.module.scss'

const CHANGE_EVENT = 'ff14-macro-theme-change'
const DARK_QUERY = '(prefers-color-scheme: dark)'

// 手動設定（data-theme）があればそれを、無ければ OS の設定を現在のテーマとする。
function getTheme(): Theme {
  const manual = document.documentElement.dataset.theme
  if (manual === 'light' || manual === 'dark') return manual
  return window.matchMedia(DARK_QUERY).matches ? 'dark' : 'light'
}

function subscribe(onChange: () => void) {
  const media = window.matchMedia(DARK_QUERY)
  media.addEventListener('change', onChange)
  window.addEventListener(CHANGE_EVENT, onChange)
  return () => {
    media.removeEventListener('change', onChange)
    window.removeEventListener(CHANGE_EVENT, onChange)
  }
}

// 右肩に置く目立たない切り替えボタン。サーバー描画ではテーマが分からないので、
// マウントするまでは絵文字を出さず、場所だけ確保する（hydration の不一致を避ける）。
export function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, getTheme, () => null)

  function toggle() {
    const next: Theme = getTheme() === 'dark' ? 'light' : 'dark'
    document.documentElement.dataset.theme = next
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next)
    } catch {
      // 保存できなくても、このページの間は切り替わる。
    }
    window.dispatchEvent(new Event(CHANGE_EVENT))
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className={styles.toggle}
      aria-label={theme === 'dark' ? 'ライトモードに切り替え' : 'ダークモードに切り替え'}
      title={theme === 'dark' ? 'ライトモードに切り替え' : 'ダークモードに切り替え'}
    >
      {theme === null ? null : theme === 'dark' ? '🌙' : '☀️'}
    </button>
  )
}
