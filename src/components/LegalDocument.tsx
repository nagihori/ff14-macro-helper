import Link from 'next/link'
import type { ReactNode } from 'react'
import styles from './LegalDocument.module.scss'

// 利用規約・プライバシーポリシー共通の枠。本文は各ページが children で渡す。
export function LegalDocument({ title, updated, other, children }: { title: string; updated: string; other: { href: string; label: string }; children: ReactNode }) {
  return (
    <div className={styles.page}>
      <main className={styles.container}>
        <Link href="/macros" className={styles.backLink}>← 公開マクロ一覧に戻る</Link>
        <article className={styles.article}>
          <h1 className={styles.title}>{title}</h1>
          <p className={styles.updated}>制定：{updated}</p>
          <div className={styles.body}>{children}</div>
          <p className={styles.otherLink}>あわせて <Link href={other.href}>{other.label}</Link> もご確認ください。</p>
        </article>
      </main>
    </div>
  )
}
