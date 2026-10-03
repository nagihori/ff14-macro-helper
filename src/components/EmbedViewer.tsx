'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import type { LogEntry } from '@/lib/macro/types'
import { PreviewIcon } from './icons'
import { LogList } from './LogList'
import { EmbedCopyButton } from './EmbedCopyButton'
import styles from './EmbedViewer.module.scss'

// 埋め込み表示（/embed/{slug}）の本体。CodePen のように、上に「マクロ」タブと「プレビュー」の切り替えと「{サイト名}で編集」、
// 中にコード（左）とログプレビュー（右）、下にコピーと再生。プレビューは初期は表示で、押すと隠れる。
// 狭い幅（スマホなど）では 2 つを並べず、コードを見せ、「プレビュー」を押したあいだだけプレビューに切り替える。
// コードは色付きの表示（サーバーで作って渡す）。プレビューの行（entries）もサーバーで作ってあり、時刻は [HH:mm] のまま。
export function EmbedViewer({ title, detailHref, body, entries, code, editHref, brandName }: { title: string; detailHref: string; body: string; entries: LogEntry[]; code: React.ReactNode; editHref: string; brandName: string }) {
  const [previewOn, setPreviewOn] = useState(true)
  const [touched, setTouched] = useState(false)
  // null は「全行を見せる」（初期）。再生を押すと 1 行から始めて、/wait の秒数に応じて 1 行ずつ増える。
  const [revealed, setRevealed] = useState<number | null>(null)
  const timers = useRef<number[]>([])
  const logRef = useRef<HTMLDivElement>(null)

  function clearTimers() {
    timers.current.forEach((id) => window.clearTimeout(id))
    timers.current = []
  }
  useEffect(() => clearTimers, [])
  // 行が増えたら、いちばん下まで追いかける。
  useEffect(() => {
    if (revealed !== null) logRef.current?.scrollTo({ top: logRef.current.scrollHeight })
  }, [revealed])

  function play() {
    clearTimers()
    // 狭い幅では、再生を押したらプレビューに切り替わる（コードを見せている間は、プレビューが隠れているため）。
    setTouched(true)
    setRevealed(entries.length > 0 ? 1 : 0)
    entries.forEach((entry, index) => {
      if (index === 0) return
      timers.current.push(window.setTimeout(() => setRevealed((prev) => Math.max(prev ?? 0, index + 1)), entry.delaySeconds * 1000))
    })
  }

  const playing = revealed !== null && revealed < entries.length
  const shown = revealed === null ? entries : entries.slice(0, revealed)

  return (
    <div className={styles.viewer} data-preview={previewOn ? 'on' : 'off'} data-touched={touched ? 'yes' : 'no'}>
      {/* 上のバーは、下のコード・プレビューの 2 列に合わせる（左：マクロ名、右：プレビューの切り替えと EDIT ON）。 */}
      <div className={styles.topBar}>
        <div className={styles.barLeft}>
          {/* マクロ名は詳細ページへのリンク（貼り付け先のページを離れないよう別タブ）。 */}
          <a href={detailHref} target="_blank" rel="noopener" className={`${styles.tab} ${styles.active}`} title={`${title}（${brandName}で詳細を開く）`}>{title}</a>
        </div>
        <div className={styles.barRight}>
          <button
            type="button"
            className={styles.tab}
            aria-pressed={previewOn}
            title="ログのプレビューを出す／隠す（ゲーム内の動作を保証するものではありません）"
            onClick={() => { setPreviewOn((value) => !value); setTouched(true) }}
          >
            プレビュー
          </button>
          <a href={editHref} target="_blank" rel="noopener" className={styles.edit} title={`${brandName}のエディタで開く`}>
            <span className={styles.editOn}>EDIT ON</span>
            <span className={styles.editBrand}>
              <Image src="/favicon.png" alt="" width={18} height={18} className={styles.logo} />
              {brandName}
            </span>
          </a>
        </div>
      </div>

      <div className={styles.panes}>
        <div className={styles.codePane}>{code}</div>
        {previewOn && (
          <div className={styles.previewPane} ref={logRef} aria-label="ログのプレビュー">
            <LogList entries={shown} />
          </div>
        )}
      </div>

      <div className={styles.bottomBar}>
        <EmbedCopyButton text={body} />
        {previewOn && (
          <button type="button" className={styles.play} onClick={play}>
            <PreviewIcon />
            {playing ? '再生中…' : '再生'}
          </button>
        )}
      </div>
    </div>
  )
}
