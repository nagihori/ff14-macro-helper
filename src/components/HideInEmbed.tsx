'use client'

import { usePathname } from 'next/navigation'

// 埋め込み（/embed/…）では、ヘッダー・フッター・アクセス解析を出さない（ほかのサイトの中に貼られるので）。
export function HideInEmbed({ children }: { children: React.ReactNode }) {
  return usePathname().startsWith('/embed/') ? null : children
}
