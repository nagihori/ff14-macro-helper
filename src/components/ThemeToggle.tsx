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

// 線だけのアイコン（Lucide の sun / moon の形。ライブラリは入れず SVG をそのまま置く）。色は currentColor。
function iconProps() {
  return {
    width: 16,
    height: 16,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
  }
}

function SunIcon() {
  return (
    <svg {...iconProps()}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg {...iconProps()}>
      <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
    </svg>
  )
}

// 右肩に置く目立たない切り替えボタン。サーバー描画ではテーマが分からないので、
// マウントするまではアイコンを出さず、場所だけ確保する（hydration の不一致を避ける）。
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
      {theme === null ? null : theme === 'dark' ? <MoonIcon /> : <SunIcon />}
    </button>
  )
}
