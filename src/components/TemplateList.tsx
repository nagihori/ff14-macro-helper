'use client'

import { useState } from 'react'
import type { TemplateMacro } from '@/lib/templates/search'
import styles from './TemplateList.module.scss'

export type TemplateUse = 'replace' | 'top' | 'after-cursor'

// 雛形の一覧（エディタ右の検索結果と、空のエディタでのおすすめで共通）。
// 「使う」は、エディタが空ならそのまま読み込み、すでに書いてあるなら「先頭に挿入／カーソルの下に挿入／置き換える」を選ばせる
// （冒頭に置く /merror off のような断片と、まるごとの雛形の、両方の使い方に合わせる）。
export function TemplateList({ items, editorEmpty, onUse, compact }: { items: TemplateMacro[]; editorEmpty: boolean; onUse: (template: TemplateMacro, how: TemplateUse) => void; compact?: boolean }) {
  const [choosing, setChoosing] = useState<string | null>(null)
  return (
    <ul className={compact ? `${styles.list} ${styles.compact}` : styles.list}>
      {items.map((template) => (
        <li key={template.slug} className={styles.item}>
          <p className={styles.head}>
            <span className={styles.title}>{template.title}</span>
            <a href={`/macros/${template.slug}`} target="_blank" rel="noopener" className={styles.detail} aria-label={`${template.title}の詳細ページを新しいタブで開く`}>詳細 ↗</a>
          </p>
          {template.description && <p className={styles.description}>{template.description}</p>}
          <p className={styles.meta}>
            {template.tags.slice(0, 3).map((tag) => `#${tag}`).join(' ')}
            {template.tags.length > 0 && ' ・ '}
            {template.body.split('\n').length} 行
          </p>
          {choosing === template.slug && !editorEmpty ? (
            <p className={styles.actions}>
              <button type="button" onClick={() => { onUse(template, 'top'); setChoosing(null) }}>先頭に挿入</button>
              <button type="button" onClick={() => { onUse(template, 'after-cursor'); setChoosing(null) }}>カーソルの下に挿入</button>
              <button type="button" onClick={() => { onUse(template, 'replace'); setChoosing(null) }}>本文を置き換える</button>
              <button type="button" className={styles.cancel} onClick={() => setChoosing(null)}>やめる</button>
            </p>
          ) : (
            <p className={styles.actions}>
              <button type="button" className={styles.use} onClick={() => (editorEmpty ? onUse(template, 'replace') : setChoosing(template.slug))}>使う</button>
            </p>
          )}
        </li>
      ))}
    </ul>
  )
}
