'use client'

import { useEffect, useMemo, useState } from 'react'
import { analyze } from '@/lib/macro/analyze'
import { toLogPreview } from '@/lib/macro/log-preview'
import { getDictionary } from '@/lib/commands/dictionary'
import { buildShareUrl, decodeDocument, readShareParam } from '@/lib/share/url'

const dictionary = getDictionary()

// UI はここでモデルを表示するだけ。文字数・構文・コマンドの意味は lib/macro が判断する（AGENTS.md）。
export function MacroWorkbench() {
  const [body, setBody] = useState('')
  const [shareStatus, setShareStatus] = useState<string | null>(null)
  const [restoreError, setRestoreError] = useState<string | null>(null)

  // 静的プリレンダーとの hydration 不一致を避けるため、URL 復元はマウント後の
  // 1 回だけ実行する（外部システム = URL との同期という effect の正当な用途）。
  useEffect(() => {
    const param = readShareParam(window.location.search)
    if (!param) return
    const result = decodeDocument(param)
    if (result.ok) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- URL という外部システムからのマウント時 1 回限りの復元
      setBody(result.document.body)
    } else {
      setRestoreError(
        result.reason === 'unsupported-version'
          ? '共有データが未対応のバージョンです。'
          : '共有データを読み込めませんでした。',
      )
    }
  }, [])

  const analysis = useMemo(() => analyze(body, dictionary), [body])
  const logEntries = useMemo(() => toLogPreview(analysis.lines), [analysis.lines])

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(body)
      setShareStatus('コピーしました。')
    } catch {
      setShareStatus('コピーに失敗しました。')
    }
  }

  async function handleShare() {
    const url = buildShareUrl(analysis.document, window.location.href)
    try {
      await navigator.clipboard.writeText(url)
      setShareStatus('共有 URL をコピーしました。')
    } catch {
      setShareStatus(url)
    }
  }

  return (
    <div className="grid w-full max-w-5xl grid-cols-1 gap-6 p-8 md:grid-cols-2">
      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold text-zinc-500">エディタ</h2>
        {restoreError && (
          <p className="rounded bg-red-100 px-3 py-2 text-sm text-red-800" role="alert">
            {restoreError}
          </p>
        )}
        <textarea
          value={body}
          onChange={(event) => setBody(event.target.value)}
          rows={15}
          spellCheck={false}
          className="w-full flex-1 rounded border border-zinc-300 bg-white p-3 font-mono text-sm text-black dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
          placeholder={'/ac "アクション名" <t>\n/wait 1'}
        />
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleCopy}
            className="rounded bg-black px-3 py-1.5 text-sm text-white dark:bg-white dark:text-black"
          >
            コピー
          </button>
          <button
            type="button"
            onClick={handleShare}
            className="rounded border border-zinc-300 px-3 py-1.5 text-sm dark:border-zinc-700"
          >
            共有 URL をコピー
          </button>
          {shareStatus && <p className="self-center text-sm text-zinc-500">{shareStatus}</p>}
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <div>
          <h2 className="text-sm font-semibold text-zinc-500">診断</h2>
          {analysis.diagnostics.length === 0 ? (
            <p className="text-sm text-zinc-400">問題は見つかりませんでした。</p>
          ) : (
            <ul className="flex flex-col gap-1">
              {analysis.diagnostics.map((diagnostic, index) => (
                <li
                  key={`${diagnostic.code}-${diagnostic.line}-${index}`}
                  className="rounded border border-zinc-300 px-3 py-1.5 text-sm dark:border-zinc-700"
                >
                  <span className="font-mono text-xs text-zinc-500">
                    L{diagnostic.line} · {diagnostic.severity}
                  </span>
                  <p>{diagnostic.message}</p>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <h2 className="text-sm font-semibold text-zinc-500">ログプレビュー</h2>
          <ul className="flex flex-col gap-1 font-mono text-sm">
            {logEntries.map((entry) => (
              <li key={entry.line} className="text-zinc-700 dark:text-zinc-300">
                <span className="text-zinc-400">L{entry.line}</span> {entry.text}
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  )
}
